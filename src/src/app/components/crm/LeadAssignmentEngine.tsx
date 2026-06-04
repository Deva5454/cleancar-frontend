import { useState } from "react";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import { useCustomers } from "../../contexts/CustomerContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Pause,
  Coffee,
  Calendar,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  X,
  Save,
  Trash2,
  Plus,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";

type ExecutiveStatus = "available" | "paused" | "on-leave" | "inactive";

type Executive = {
  id: string;
  name: string;
  status: ExecutiveStatus;
  leadsToday: number;
  dailyCapacity: number;
  pausedUntil?: string;
  pauseReason?: string;
  lastAssigned?: string;
  avgResponseTime: number; // in minutes
  conversionRate: number; // percentage
};

const mockExecutives: Executive[] = [
  {
    id: "EX001",
    name: "Priya Sharma",
    status: "available",
    leadsToday: 12,
    dailyCapacity: 25,
    lastAssigned: "10:15 AM",
    avgResponseTime: 2.5,
    conversionRate: 28,
  },
  {
    id: "EX002",
    name: "Amit Patel",
    status: "paused",
    leadsToday: 15,
    dailyCapacity: 25,
    pausedUntil: "11:00 AM",
    pauseReason: "Lunch Break",
    lastAssigned: "10:25 AM",
    avgResponseTime: 3.2,
    conversionRate: 25,
  },
  {
    id: "EX003",
    name: "Neha Singh",
    status: "available",
    leadsToday: 10,
    dailyCapacity: 25,
    lastAssigned: "10:10 AM",
    avgResponseTime: 2.8,
    conversionRate: 32,
  },
  {
    id: "EX004",
    name: "Rahul Verma",
    status: "on-leave",
    leadsToday: 0,
    dailyCapacity: 25,
    avgResponseTime: 3.5,
    conversionRate: 22,
  },
  {
    id: "EX005",
    name: "Kavita Reddy",
    status: "inactive",
    leadsToday: 0,
    dailyCapacity: 25,
    avgResponseTime: 4.0,
    conversionRate: 20,
  },
];

type WorkingHours = {
  monday: { enabled: boolean; start: string; end: string };
  tuesday: { enabled: boolean; start: string; end: string };
  wednesday: { enabled: boolean; start: string; end: string };
  thursday: { enabled: boolean; start: string; end: string };
  friday: { enabled: boolean; start: string; end: string };
  saturday: { enabled: boolean; start: string; end: string };
  sunday: { enabled: boolean; start: string; end: string };
};

export function LeadAssignmentEngine() {
  const { currentRole } = useRole();
  const { employees } = useEmployee();
  const { city } = useCity();
  const { cityLeads } = useCustomers();

  const executives = employees
    .filter(e => e.designation === "TSE" && e.status === "Active" && e.workLocation === city)
    .map(e => ({
      id: e.id,
      name: e.fullName,
      status: "available" as const,
      leadsToday: cityLeads.filter(l => l.assignedTo === e.id).length,
      dailyCapacity: 25,
      lastAssigned: cityLeads.filter(l => l.assignedTo === e.id && l.assignedAt).sort((a, b) =>
        new Date(b.assignedAt!).getTime() - new Date(a.assignedAt!).getTime()
      )[0]?.assignedAt?.split("T")[1]?.substring(0, 5) || undefined,
      avgResponseTime: 3.0,
      conversionRate: 25,
    }));

  const [localExecutives, setLocalExecutives] = useState<Executive[]>(executives);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedExecutive, setSelectedExecutive] = useState<Executive | null>(
    null
  );
  const [pauseDuration, setPauseDuration] = useState<number>(15);
  const [showConfigureRulesModal, setShowConfigureRulesModal] = useState(false);
  const [showConfigureHierarchyModal, setShowConfigureHierarchyModal] = useState(false);
  
  // Assignment Rules Configuration State
  const [dailyCapacity, setDailyCapacity] = useState(25);
  const [workingStartTime, setWorkingStartTime] = useState("09:00");
  const [workingEndTime, setWorkingEndTime] = useState("19:00");
  const [autoAssignment, setAutoAssignment] = useState(true);
  
  // Hierarchy Configuration State
  const [primaryHandler, setPrimaryHandler] = useState("Tele Sales Manager");
  const [fallback1, setFallback1] = useState("City Manager");
  const [fallback2, setFallback2] = useState("Admin");

  // Permission check for Configure buttons
  // TSM = Tele Sales Manager
  const canConfigure = currentRole === "Super Admin" || 
                       currentRole === "TSM" || 
                       currentRole === "City Manager";

  // Check if currently in working hours (9 AM - 7 PM)
  const now = new Date();
  const currentHour = now.getHours();
  const isWorkingHours = currentHour >= 9 && currentHour < 19;

  const availableExecs = localExecutives.filter((e) => e.status === "available");
  const pausedExecs = localExecutives.filter((e) => e.status === "paused");
  const onLeaveExecs = localExecutives.filter((e) => e.status === "on-leave");
  const inactiveExecs = localExecutives.filter((e) => e.status === "inactive");

  const getStatusColor = (status: ExecutiveStatus) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-300";
      case "paused":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "on-leave":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: ExecutiveStatus) => {
    switch (status) {
      case "available":
        return <UserCheck className="w-4 h-4" />;
      case "paused":
        return <Pause className="w-4 h-4" />;
      case "on-leave":
        return <Calendar className="w-4 h-4" />;
      case "inactive":
        return <UserX className="w-4 h-4" />;
    }
  };

  const handlePauseAssignment = (executive: Executive, duration: number) => {
    const updatedExecutives = localExecutives.map(exec =>
      exec.id === executive.id
        ? {
            ...exec,
            status: "paused" as const,
            pauseReason: `On ${duration} min break`,
            pauseEndTime: new Date(Date.now() + duration * 60000).toLocaleTimeString()
          }
        : exec
    );
    setLocalExecutives(updatedExecutives);
    setShowPauseModal(false);
    toast.success(`${executive.name} paused for ${duration} minutes`);
  };

  const handleResumeAssignment = (executiveId: string) => {
    const updatedExecutives = localExecutives.map(exec =>
      exec.id === executiveId
        ? { ...exec, status: "available" as const, pauseReason: undefined, pauseEndTime: undefined }
        : exec
    );
    setLocalExecutives(updatedExecutives);
    toast.success("Assignment resumed");
  };

  const handleMarkOnLeave = (executiveId: string) => {
    const updatedExecutives = localExecutives.map(exec =>
      exec.id === executiveId
        ? { ...exec, status: "on-leave" as const }
        : exec
    );
    setLocalExecutives(updatedExecutives);
    toast.info("Marked as on leave for today");
  };

  const handleActivateExecutive = (executiveId: string) => {
    const updatedExecutives = localExecutives.map(exec =>
      exec.id === executiveId
        ? { ...exec, status: "available" as const }
        : exec
    );
    setLocalExecutives(updatedExecutives);
    toast.success("Executive activated and ready for lead assignment");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Lead Assignment Engine
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Intelligent round-robin lead distribution with SLA monitoring
          </p>
        </div>
        <div className="flex gap-2">
          {canConfigure ? (
            <Button variant="outline" onClick={() => setShowConfigureRulesModal(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Configure Rules
            </Button>
          ) : (
            <Button variant="outline" disabled title="You don't have permission to configure rules">
              <Settings className="w-4 h-4 mr-2" />
              Configure Rules
            </Button>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">System Status</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isWorkingHours ? "Active" : "After Hours"}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {isWorkingHours
                    ? "Auto-assignment ON"
                    : "Manager Queue"}
                </p>
              </div>
              <Clock className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Available</p>
                <p className="text-3xl font-bold text-green-600">
                  {availableExecs.length}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Ready for leads
                </p>
              </div>
              <UserCheck className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">On Break</p>
                <p className="text-3xl font-bold text-orange-600">
                  {pausedExecs.length}
                </p>
                <p className="text-xs text-orange-600 mt-1">Temporarily paused</p>
              </div>
              <Coffee className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">On Leave</p>
                <p className="text-3xl font-bold text-purple-600">
                  {onLeaveExecs.length}
                </p>
                <p className="text-xs text-purple-600 mt-1">Full day off</p>
              </div>
              <Calendar className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Inactive</p>
                <p className="text-3xl font-bold text-red-600">
                  {inactiveExecs.length}
                </p>
                <p className="text-xs text-red-600 mt-1">Not checked in</p>
              </div>
              <UserX className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Rules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Assignment Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Working Hours Distribution
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Leads auto-assigned via Round Robin to available executives
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    After Hours Queue
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Leads go to manager queue for manual distribution next day
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Daily Capacity Limit
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Max 25 leads per executive per day to maintain quality
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Auto-Exclusions
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Paused, inactive, or on-leave executives skip assignment
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fallback Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              When Tele Sales Manager is unavailable during non-working hours:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Tele Sales Manager
                  </p>
                  <p className="text-xs text-gray-500">Primary handler</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Operations Manager
                  </p>
                  <p className="text-xs text-gray-500">
                    Fallback if manager absent
                  </p>
                </div>
                <Badge variant="outline">Fallback 1</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Admin
                  </p>
                  <p className="text-xs text-gray-500">Final escalation</p>
                </div>
                <Badge variant="outline">Fallback 2</Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              {canConfigure ? (
                <Button className="w-full" variant="outline" onClick={() => setShowConfigureHierarchyModal(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Hierarchy
                </Button>
              ) : (
                <Button className="w-full" variant="outline" disabled title="You don't have permission to configure hierarchy">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Hierarchy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Status & Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Executive
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Leads Today
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Capacity
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Last Assigned
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Avg Response
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Conversion
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {localExecutives.map((exec) => (
                  <tr key={exec.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {exec.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {exec.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {exec.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`${getStatusColor(exec.status)}`}>
                        {getStatusIcon(exec.status)}
                        <span className="ml-1 capitalize">
                          {exec.status.replace("-", " ")}
                        </span>
                      </Badge>
                      {exec.pausedUntil && (
                        <p className="text-xs text-gray-500 mt-1">
                          Until {exec.pausedUntil}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-lg font-bold text-gray-900">
                        {exec.leadsToday}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-gray-600">
                          {exec.leadsToday}/{exec.dailyCapacity}
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              (exec.leadsToday / exec.dailyCapacity) * 100 >= 80
                                ? "bg-red-500"
                                : (exec.leadsToday / exec.dailyCapacity) * 100 >=
                                  60
                                ? "bg-orange-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${
                                (exec.leadsToday / exec.dailyCapacity) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {exec.lastAssigned || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-gray-900">
                        {exec.avgResponseTime} min
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-semibold text-green-600">
                          {exec.conversionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {exec.status === "available" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedExecutive(exec)}
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      {exec.status === "paused" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleResumeAssignment(exec.id)}
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          Resume
                        </Button>
                      )}
                      {exec.status === "inactive" && (
                        <Badge className="bg-red-100 text-red-800">
                          Not Checked In
                        </Badge>
                      )}
                      {exec.status === "on-leave" && (
                        <Badge className="bg-purple-100 text-purple-800">
                          On Leave
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pause Modal */}
      {selectedExecutive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Pause Lead Assignment</CardTitle>
              <p className="text-sm text-gray-500">
                {selectedExecutive.name} will not receive new leads during pause
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pause Duration</Label>
                <Select value={pauseDuration.toString()} onValueChange={value => setPauseDuration(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    handlePauseAssignment(selectedExecutive, pauseDuration);
                    setSelectedExecutive(null);
                  }}
                >
                  Confirm Pause
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedExecutive(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configure Rules Modal */}
      {showConfigureRulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Configure Assignment Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Daily Capacity</Label>
                <Input
                  type="number"
                  value={dailyCapacity}
                  onChange={(e) => setDailyCapacity(parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label>Working Start Time</Label>
                <Input
                  type="time"
                  value={workingStartTime}
                  onChange={(e) => setWorkingStartTime(e.target.value)}
                />
              </div>

              <div>
                <Label>Working End Time</Label>
                <Input
                  type="time"
                  value={workingEndTime}
                  onChange={(e) => setWorkingEndTime(e.target.value)}
                />
              </div>

              <div>
                <Label>Auto Assignment</Label>
                <Select value={autoAssignment ? "true" : "false"} onValueChange={value => setAutoAssignment(value === "true")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Enabled</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowConfigureRulesModal(false);
                    toast.success(`✅ Assignment Rules Updated!\n\nDaily Capacity: ${dailyCapacity} leads\nWorking Hours: ${workingStartTime} - ${workingEndTime}\nAuto Assignment: ${autoAssignment ? 'Enabled' : 'Disabled'}\n\nChanges applied successfully.`);
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfigureRulesModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configure Hierarchy Modal */}
      {showConfigureHierarchyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Configure Fallback Hierarchy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary Handler</Label>
                <Input
                  type="text"
                  value={primaryHandler}
                  onChange={(e) => setPrimaryHandler(e.target.value)}
                />
              </div>

              <div>
                <Label>Fallback 1</Label>
                <Input
                  type="text"
                  value={fallback1}
                  onChange={(e) => setFallback1(e.target.value)}
                />
              </div>

              <div>
                <Label>Fallback 2</Label>
                <Input
                  type="text"
                  value={fallback2}
                  onChange={(e) => setFallback2(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowConfigureHierarchyModal(false);
                    toast.success(`✅ Fallback Hierarchy Updated!\n\nPrimary Handler: ${primaryHandler}\nFallback 1: ${fallback1}\nFallback 2: ${fallback2}\n\nEscalation chain configured successfully.`);
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfigureHierarchyModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}