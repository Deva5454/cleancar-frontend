/**
 * Demo Assignments Tab - Enhanced (Part 2)
 * Supervisor washer assignment with demo types, deadline enforcement, and escalation logic
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Clock,
  User,
  MapPin,
  Calendar,
  Car,
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
  Users,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useDemos } from "../../contexts/DemoContext";
import { useRole } from "../../contexts/RoleContext";
import { toast } from "sonner";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { useCity } from "../../contexts/CityContext";
import { logger } from "../../services/logger";

interface AvailableWasher {
  id: string;
  name: string;
  zone: string;
  jobsAssignedToday: number;
  availabilityStatus: "Available" | "Partially Occupied" | "Fully Booked";
}

export function DemoAssignmentsEnhanced() {
  const { city } = useCity();
  const dbEmps = employeeDatabaseService.getAll();
  const AVAILABLE_WASHERS = dbEmps
    .filter(e => e.role === "Car Washer" && e.city === city)
    .map(e => ({
      id: e.employeeId,
      name: e.firstName + " " + e.lastName,
      zone: e.unit || "Zone A",
      isAvailable: true,
    }));

  const { demos, assignWasher } = useDemos();
  const { currentUser } = useRole();
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [demoTypeFilter, setDemoTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pinCodeFilter, setPinCodeFilter] = useState("");
  const [washerFilter, setWasherFilter] = useState("all");

  // Filter demos assigned to current supervisor based on assignedSupervisor field
  const mySupervisorDemos = demos.filter((demo) => {
    // Match supervisor name (e.g., "Ramesh Vora" or "Suresh Yadav")
    const supervisorFirstName = currentUser.name.split(' ')[0]; // "Suresh" from "Suresh Yadav"
    return demo.assignedSupervisor.includes(supervisorFirstName);
  });

  // Debug logging
  logger.log('=== SUPERVISOR DEMO FILTERING DEBUG ===');
  logger.log('Current User:', currentUser.name);
  logger.log('Total Demos:', demos.length);
  logger.log('My Supervisor Demos:', mySupervisorDemos.length);
  logger.log('Demo IDs:', mySupervisorDemos.map(d => d.id));
  logger.log('======================================');

  // Calculate time remaining until deadline
  const getTimeRemaining = (deadline: string) => {
    const deadlineTime = new Date(deadline);
    const now = new Date();

    if (now > deadlineTime) {
      return { hours: 0, minutes: 0, isOverdue: true };
    }

    const diff = deadlineTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, isOverdue: false };
  };

  const handleAssignWasher = (demoId: string, washerName: string) => {
    const demo = filteredDemos.find((d) => d.id === demoId);
    
    assignWasher(demoId, washerName, "Ramesh Vora (Supervisor)");

    // Notifications
    toast.success("Washer Assigned Successfully", {
      description: `${washerName} has been assigned to ${demo?.customerFirstName}'s demo`,
    });

    // Simulate notifications
    logger.log(`✅ Notification to ${washerName}: New demo assigned. Customer: ${demo?.customerFirstName}, Date: ${demo?.demoDate}, Time: ${demo?.demoTimeSlot}. Please accept or decline.`);
    logger.log(`✅ Notification to TSE ${demo?.tseScheduledBy}: Washer ${washerName} assigned for ${demo?.customerName}'s demo.`);
    logger.log(`✅ Notification to Operations Manager: Washer ${washerName} assigned to demo for ${demo?.customerName} by Supervisor Ramesh Vora.`);

    setShowAssignModal(null);
  };

  // Filter demos
  const filteredDemos = mySupervisorDemos.filter((demo) => {
    if (dateFilter && demo.demoDate !== dateFilter) return false;
    if (demoTypeFilter !== "all" && demo.demoType !== demoTypeFilter) return false;
    if (statusFilter !== "all" && demo.assignmentStatus !== statusFilter) return false;
    if (pinCodeFilter && !demo.pinCode.includes(pinCodeFilter)) return false;
    if (washerFilter !== "all" && demo.washerName !== washerFilter) return false;
    return true;
  });

  // Calculate today's stats
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const todayDemos = mySupervisorDemos.filter((d) => isToday(d.demoDate));
  const todayAssigned = todayDemos.filter((d) => d.washerAssigned).length;
  const todayAcknowledged = todayDemos.filter((d) => d.acknowledgmentStatus === "Accepted").length;
  const todayInProgress = todayDemos.filter((d) => d.assignmentStatus === "In Progress").length;
  const todayCompleted = todayDemos.filter((d) => d.demoCompleted).length;
  const todayPending = todayDemos.filter((d) => !d.washerAssigned).length;
  const todayEscalated = todayDemos.filter((d) => d.assignmentDeadlinePassed && !d.washerAssigned).length;

  // Deadline escalation check
  useEffect(() => {
    const checkEscalations = () => {
      demos.forEach((demo) => {
        if (!demo.washerAssigned) {
          const timeRemaining = getTimeRemaining(demo.assignmentDeadline);
          
          // Escalate if deadline passed
          if (timeRemaining.isOverdue && isToday(demo.demoDate)) {
            logger.log(`🚨 URGENT ESCALATION: Demo ${demo.id} for ${demo.customerName} has no washer assigned! Deadline: ${demo.assignmentDeadline}`);
            
            // In real system, fire notifications to OM and Super Admin
            toast.error("Demo Assignment Deadline Missed", {
              description: `${demo.customerName}'s demo on ${demo.demoDate} needs immediate attention`,
              duration: 10000,
            });
          }
          
          // Warning at 1 hour before deadline
          if (!timeRemaining.isOverdue && timeRemaining.hours === 0 && timeRemaining.minutes <= 60 && timeRemaining.minutes > 55) {
            toast.warning("Demo Assignment Due Soon", {
              description: `Washer must be assigned for ${demo.customerFirstName}'s demo within 1 hour`,
            });
          }
        }
      });
    };

    const interval = setInterval(checkEscalations, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [demos]);

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium">Today's Demos</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{todayDemos.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-medium">Assigned</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{todayAssigned}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-700 font-medium">Acknowledged</p>
                <p className="text-2xl font-bold text-teal-900 mt-1">{todayAcknowledged}</p>
              </div>
              <Users className="w-8 h-8 text-teal-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-700 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{todayInProgress}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 font-medium">Completed</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{todayCompleted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${todayPending > 0 ? 'from-orange-50 to-orange-100 border-orange-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${todayPending > 0 ? 'text-orange-700' : 'text-gray-700'}`}>Pending</p>
                <p className={`text-2xl font-bold mt-1 ${todayPending > 0 ? 'text-orange-900' : 'text-gray-900'}`}>{todayPending}</p>
              </div>
              <Clock className={`w-8 h-8 opacity-50 ${todayPending > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${todayEscalated > 0 ? 'from-red-50 to-red-100 border-red-200 animate-pulse' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${todayEscalated > 0 ? 'text-red-700' : 'text-gray-700'}`}>Escalated</p>
                <p className={`text-2xl font-bold mt-1 ${todayEscalated > 0 ? 'text-red-900' : 'text-gray-900'}`}>{todayEscalated}</p>
              </div>
              <AlertTriangle className={`w-8 h-8 opacity-50 ${todayEscalated > 0 ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Demo Date</label>
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Demo Type</label>
              <Select value={demoTypeFilter} onValueChange={setDemoTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="One-Time Service Demo">One-Time Service</SelectItem>
                  <SelectItem value="Subscription Package Demo">Subscription Package</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Acknowledged by Washer">Acknowledged</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">PIN Code</label>
              <Input placeholder="Search PIN..." value={pinCodeFilter} onChange={(e) => setPinCodeFilter(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Washer</label>
              <Select value={washerFilter} onValueChange={setWasherFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Washers</SelectItem>
                  {AVAILABLE_WASHERS.map((w) => (
                    <SelectItem key={w.id} value={w.name}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demo Assignments</CardTitle>
            <Badge variant="outline">
              {filteredDemos.length} demo{filteredDemos.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Demo Date</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Demo Type</TableHead>
                  <TableHead>Address / PIN</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Washer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDemos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No demo assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDemos.map((demo) => {
                    const timeRemaining = getTimeRemaining(demo.assignmentDeadline);
                    const isUrgent = timeRemaining.hours < 1 && !timeRemaining.isOverdue;
                    const isEscalated = timeRemaining.isOverdue && !demo.washerAssigned;

                    return (
                      <TableRow key={demo.id} className={isEscalated ? "bg-red-50" : ""}>
                        {/* Customer - First Name Only for Supervisor */}
                        <TableCell className="font-medium">{demo.customerFirstName}</TableCell>

                        {/* Demo Date */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(demo.demoDate).toLocaleDateString("en-IN")}
                          </div>
                        </TableCell>

                        {/* Time Slot */}
                        <TableCell className="text-sm">{demo.demoTimeSlot}</TableCell>

                        {/* Demo Type */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              demo.demoType === "One-Time Service Demo"
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : "bg-teal-50 text-teal-700 border-teal-300"
                            }
                          >
                            {demo.demoType === "One-Time Service Demo" ? "One-Time" : "Subscription"}
                          </Badge>
                        </TableCell>

                        {/* Address / PIN - Area and PIN only */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{demo.area}</span>
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {demo.pinCode}
                          </Badge>
                        </TableCell>

                        {/* Vehicle */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Car className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{demo.vehicleCategory}</span>
                          </div>
                          {demo.vehicleColor && <p className="text-xs text-gray-500">{demo.vehicleColor}</p>}
                          <p className="text-xs text-gray-500">{demo.vehicleRegistrationNumber}</p>
                        </TableCell>

                        {/* Plan - No Price for Supervisor */}
                        <TableCell className="text-sm">{demo.planName}</TableCell>

                        {/* Washer Assigned */}
                        <TableCell>
                          {demo.washerName ? (
                            <div>
                              <p className="text-sm font-medium">{demo.washerName}</p>
                              {demo.washerAssignedAt && (
                                <p className="text-xs text-gray-500">
                                  {new Date(demo.washerAssignedAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not assigned</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {isEscalated ? (
                            <Badge variant="destructive" className="animate-pulse">
                              ESCALATED
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                demo.assignmentStatus === "Completed"
                                  ? "default"
                                  : demo.assignmentStatus === "Acknowledged by Washer"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                demo.assignmentStatus === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : demo.assignmentStatus === "Acknowledged by Washer"
                                  ? "bg-blue-100 text-blue-800"
                                  : demo.assignmentStatus === "Assigned"
                                  ? "bg-teal-100 text-teal-800"
                                  : "bg-orange-100 text-orange-800"
                              }
                            >
                              {demo.assignmentStatus}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Deadline */}
                        <TableCell>
                          {!demo.washerAssigned && !timeRemaining.isOverdue ? (
                            <div className={`text-sm ${isUrgent ? "text-red-600 font-bold animate-pulse" : "text-gray-600"}`}>
                              {timeRemaining.hours}h {timeRemaining.minutes}m
                            </div>
                          ) : timeRemaining.isOverdue && !demo.washerAssigned ? (
                            <span className="text-xs text-red-600 font-bold">OVERDUE</span>
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right">
                          {!demo.washerAssigned && (
                            <Button size="sm" onClick={() => setShowAssignModal(demo.id)} className="bg-teal-600 hover:bg-teal-700">
                              Assign Washer
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Washer Modal */}
      {showAssignModal && (() => {
        const demo = filteredDemos.find((d) => d.id === showAssignModal);
        if (!demo) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-teal-600 text-white p-4 flex items-center justify-between rounded-t-lg">
                <h3 className="font-bold text-lg">Assign Washer — {demo.customerFirstName}'s Demo</h3>
                <button onClick={() => setShowAssignModal(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Demo Summary */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <strong>Customer:</strong> {demo.customerFirstName}
                    </div>
                    <div>
                      <strong>Demo Type:</strong>{" "}
                      <Badge variant="outline" className={demo.demoType === "One-Time Service Demo" ? "bg-amber-50" : "bg-teal-50"}>
                        {demo.demoType === "One-Time Service Demo" ? "One-Time" : "Subscription"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <strong>Date & Time:</strong> {new Date(demo.demoDate).toLocaleDateString()} • {demo.demoTimeSlot}
                    </div>
                    <div>
                      <strong>Vehicle:</strong> {demo.vehicleCategory} {demo.vehicleColor && `(${demo.vehicleColor})`}
                    </div>
                  </div>
                  <div>
                    <strong>Address:</strong> {demo.area}, {demo.pinCode}
                  </div>
                  <div>
                    <strong>Plan:</strong> {demo.planName}
                  </div>
                  {demo.specialInstructions && (
                    <div className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                      <strong>Special Instructions:</strong> {demo.specialInstructions}
                    </div>
                  )}
                  {demo.declinedBy && demo.declinedBy.length > 0 && (
                    <div className="text-red-800 bg-red-50 p-2 rounded border border-red-200 mt-2">
                      <strong>Previously Declined By:</strong> {(demo.declinedBy ?? []).join(", ")}
                    </div>
                  )}
                </div>

                {/* Available Washers */}
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Available Washers
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AVAILABLE_WASHERS.map((washer) => (
                    <div
                      key={washer.id}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        washer.availabilityStatus === "Fully Booked"
                          ? "border-gray-200 bg-gray-50 opacity-50"
                          : washer.availabilityStatus === "Partially Occupied"
                          ? "border-amber-200 bg-amber-50 hover:border-teal-400 cursor-pointer"
                          : "border-gray-200 hover:border-teal-400 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{washer.name}</p>
                          <p className="text-sm text-gray-600">{washer.zone}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            washer.availabilityStatus === "Available"
                              ? "bg-green-50 text-green-700 border-green-300"
                              : washer.availabilityStatus === "Partially Occupied"
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-red-50 text-red-700 border-red-300"
                          }
                        >
                          {washer.availabilityStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Jobs assigned today: {washer.jobsAssignedToday}</p>
                      <Button
                        size="sm"
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        disabled={washer.availabilityStatus === "Fully Booked"}
                        onClick={() => handleAssignWasher(demo.id, washer.name)}
                      >
                        Assign {washer.name}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}