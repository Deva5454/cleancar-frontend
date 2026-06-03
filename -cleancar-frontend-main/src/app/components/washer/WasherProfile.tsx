// My Profile Tab - Washer Profile and Settings
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  Clock,
  Settings,
  TrendingUp,
  Package,
  FileText,
  DollarSign,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { useNavigate } from "react-router-dom";

export function WasherProfile() {
  const { currentUser } = useRole();
  const navigate = useNavigate();

  const profileData = {
    fullName: currentUser.name,
    employeeId: "EMP-WA-2026-045",
    designation: "Car Washer",
    dateOfJoining: "Jan 15, 2026",
    reportingTo: "Suresh Yadav",
    phone: "+91 98765 43217",
    email: "rahul.verma@cleancar360.com",
    assignedZones: [
      { pinCode: "395009", area: "Adajan" },
      { pinCode: "395007", area: "Vesu" },
    ],
  };

  const currentMonthStats = {
    jobsCompleted: 245,
    qualityScore: 87,
    attendanceRate: 96,
    clBalance: 3,
    slBalance: 5,
    elBalance: 2,
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <div className="text-center">
        <div className="w-24 h-24 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl font-bold text-white">
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {profileData.fullName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {profileData.employeeId}
        </p>
        <Badge className="bg-teal-100 text-teal-800 mt-2">
          {profileData.designation}
        </Badge>
      </div>

      {/* Work Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">This Month</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {currentMonthStats.jobsCompleted}
              </p>
              <p className="text-xs text-gray-600 mt-1">Jobs Completed</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">
                {currentMonthStats.qualityScore}
              </p>
              <p className="text-xs text-gray-600 mt-1">Quality Score</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">
                {currentMonthStats.attendanceRate}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Attendance</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-amber-700">
                CL:{currentMonthStats.clBalance} SL:{currentMonthStats.slBalance} EL:{currentMonthStats.elBalance}
              </p>
              <p className="text-xs text-gray-600 mt-1">Leave Balance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Personal Details</h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Employee ID</p>
              <p className="font-medium text-gray-900">{profileData.employeeId}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Date of Joining</p>
              <p className="font-medium text-gray-900">
                {profileData.dateOfJoining}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Reporting To</p>
              <p className="font-medium text-gray-900">
                {profileData.reportingTo}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{profileData.phone}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{profileData.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Zones */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-600" />
            My Zones
          </h3>
          <div className="flex gap-2 flex-wrap">
            {profileData.assignedZones.map((zone, idx) => (
              <Badge key={idx} variant="outline" className="px-3 py-1.5">
                {zone.pinCode} — {zone.area}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-20 flex-col gap-1 border-2"
          onClick={() => navigate("/washer/attendance")}
        >
          <Clock className="w-6 h-6 text-teal-600" />
          <span className="text-sm font-medium">Attendance</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex-col gap-1 border-2"
          onClick={() => navigate("/performance")}
        >
          <TrendingUp className="w-6 h-6 text-green-600" />
          <span className="text-sm font-medium">Performance</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex-col gap-1 border-2"
          onClick={() => navigate("/advance/my-advances")}
        >
          <DollarSign className="w-6 h-6 text-blue-600" />
          <span className="text-sm font-medium">My Advances</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex-col gap-1 border-2"
          onClick={() => navigate("/inventory/my-stock")}
        >
          <Package className="w-6 h-6 text-purple-600" />
          <span className="text-sm font-medium">My Equipment</span>
        </Button>
      </div>

      {/* Settings */}
      <Button
        variant="outline"
        className="w-full h-14 border-2 border-gray-300"
      >
        <Settings className="w-5 h-5 mr-2" />
        App Settings
      </Button>
    </div>
  );
}
