/**
 * Demo Assignments Tab for Supervisor Module
 * Part 2 - Supervisor Washer Assignment & 6 AM Escalation
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Clock, User, MapPin, Calendar, Car, AlertTriangle,
  CheckCircle, X, Filter
} from "lucide-react";
import { toast } from "sonner";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { useCity } from "../../contexts/CityContext";
import { logger } from "../../services/logger";

interface DemoAssignment {
  id: string;
  customerName: string;
  demoDate: string;
  timeSlot: string;
  serviceAddress: string;
  pinCode: string;
  vehicle: string;
  vehicleRegNo: string;
  plan: string;
  tseName: string;
  washerAssigned: string | null;
  assignedAt: string | null;
  assignmentStatus: "Pending" | "Assigned" | "Confirmed";
  supervisorName: string;
  specialInstructions?: string;
}

interface AvailableWasher {
  id: string;
  name: string;
  zone: string;
  jobsAssignedToday: number;
  isAvailable: boolean;
}

const DEMO_ASSIGNMENTS: DemoAssignment[] = [
  {
    id: "DEMO001",
    customerName: "Arjun Patel",
    demoDate: "2026-03-17",
    timeSlot: "Morning 7–9 AM",
    serviceAddress: "Plot 45, Adajan, Surat",
    pinCode: "395007",
    vehicle: "Sedan",
    vehicleRegNo: "GJ05AB1234",
    plan: "Gold Monthly",
    tseName: "Neha Singh",
    washerAssigned: null,
    assignedAt: null,
    assignmentStatus: "Pending",
    supervisorName: "Ramesh Vora",
    specialInstructions: "Customer prefers thorough interior demo, vehicle is white in colour"
  },
  {
    id: "DEMO002",
    customerName: "Sneha Desai",
    demoDate: "2026-03-17",
    timeSlot: "Afternoon 11 AM–1 PM",
    serviceAddress: "B-202, Vesu, Surat",
    pinCode: "395004",
    vehicle: "SUV",
    vehicleRegNo: "GJ05CD5678",
    plan: "Platinum Quarterly",
    tseName: "Neha Singh",
    washerAssigned: "Rahul Verma",
    assignedAt: "2026-03-16 18:30",
    assignmentStatus: "Assigned",
    supervisorName: "Ramesh Vora"
  },
  {
    id: "DEMO003",
    customerName: "Karan Mehta",
    demoDate: "2026-03-18",
    timeSlot: "Evening 4–7 PM",
    serviceAddress: "Villa 12, Pal, Surat",
    pinCode: "395009",
    vehicle: "Hatchback",
    vehicleRegNo: "GJ05EF9012",
    plan: "Silver Monthly",
    tseName: "Neha Singh",
    washerAssigned: null,
    assignedAt: null,
    assignmentStatus: "Pending",
    supervisorName: "Ramesh Vora"
  }
];

export function DemoAssignmentsTab() {
  const { city } = useCity();
  const dbEmps = employeeDatabaseService.getAll();
  const AVAILABLE_WASHERS = dbEmps.filter(e => e.role==="Car Washer" && e.city===city).map(e => ({
    id: e.employeeId, name: e.firstName+" "+e.lastName, zone: e.unit||"Zone A", jobsAssignedToday: 0, isAvailable: true,
  }));

  const [assignments, setAssignments] = useState<DemoAssignment[]>(DEMO_ASSIGNMENTS);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [timeSlotFilter, setTimeSlotFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pinCodeFilter, setPinCodeFilter] = useState("");
  const [washerFilter, setWasherFilter] = useState("all");

  // Calculate time remaining until 6 AM on demo date
  const getTimeRemaining = (demoDate: string) => {
    const demo = new Date(demoDate);
    const deadline = new Date(demo.getFullYear(), demo.getMonth(), demo.getDate(), 6, 0, 0);
    const now = new Date();
    
    if (now > deadline) {
      return { hours: 0, minutes: 0, isOverdue: true };
    }

    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, isOverdue: false };
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleAssignWasher = (demoId: string, washerName: string) => {
    setAssignments(assignments.map(demo => 
      demo.id === demoId 
        ? {
            ...demo,
            washerAssigned: washerName,
            assignedAt: new Date().toISOString(),
            assignmentStatus: "Assigned"
          }
        : demo
    ));

    const demo = assignments.find(d => d.id === demoId);
    
    // Send notifications (simulated)
    toast.success("Washer assigned successfully", {
      description: `${washerName} has been assigned to ${demo?.customerName}'s demo`
    });

    // Simulate notifications to TSE and OM
    logger.log(`Notification sent to TSE ${demo?.tseName}: Washer ${washerName} assigned for ${demo?.customerName}'s demo`);
    logger.log(`Notification sent to Operations Manager: Washer ${washerName} assigned to demo for ${demo?.customerName}`);

    setShowAssignModal(null);
  };

  const filteredAssignments = assignments.filter(demo => {
    if (dateFilter && demo.demoDate !== dateFilter) return false;
    if (timeSlotFilter !== "all" && demo.timeSlot !== timeSlotFilter) return false;
    if (statusFilter !== "all" && demo.assignmentStatus !== statusFilter) return false;
    if (pinCodeFilter && !demo.pinCode.includes(pinCodeFilter)) return false;
    if (washerFilter !== "all" && demo.washerAssigned !== washerFilter) return false;
    return true;
  });

  const todayDemos = assignments.filter(d => isToday(d.demoDate));
  const assignedToday = todayDemos.filter(d => d.assignmentStatus === "Assigned").length;
  const pendingToday = todayDemos.filter(d => d.assignmentStatus === "Pending").length;

  // Check for 6 AM escalations
  useEffect(() => {
    const checkEscalations = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Check at 6 AM sharp
      if (currentHour === 6 && now.getMinutes() === 0) {
        const unassignedTodayDemos = assignments.filter(
          demo => isToday(demo.demoDate) && !demo.washerAssigned
        );

        if (unassignedTodayDemos.length > 0) {
          unassignedTodayDemos.forEach(demo => {
            // Trigger escalation notifications
            logger.log(`URGENT ESCALATION: Demo ${demo.id} for ${demo.customerName} has no washer assigned!`);
            toast.error("Demo Escalation Alert", {
              description: `${unassignedTodayDemos.length} demo(s) today without washer assigned`,
              duration: 10000
            });
          });
        }
      }
    };

    const interval = setInterval(checkEscalations, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [assignments]);

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-600">Today's Demos</p>
                <p className="text-2xl font-bold text-gray-900">{todayDemos.length}</p>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-green-600">{assignedToday}</p>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingToday}</p>
              </div>
            </div>
            {pendingToday > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {pendingToday} Pending Assignment{pendingToday > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

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
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Time Slot</label>
              <Select value={timeSlotFilter} onValueChange={setTimeSlotFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Slots</SelectItem>
                  <SelectItem value="Morning 7–9 AM">Morning 7–9 AM</SelectItem>
                  <SelectItem value="Mid-Morning 9–11 AM">Mid-Morning 9–11 AM</SelectItem>
                  <SelectItem value="Afternoon 11 AM–1 PM">Afternoon 11 AM–1 PM</SelectItem>
                  <SelectItem value="Evening 4–7 PM">Evening 4–7 PM</SelectItem>
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
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">PIN Code</label>
              <Input
                placeholder="Search PIN..."
                value={pinCodeFilter}
                onChange={(e) => setPinCodeFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Washer</label>
              <Select value={washerFilter} onValueChange={setWasherFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Washers</SelectItem>
                  {AVAILABLE_WASHERS.map(w => (
                    <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>
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
          <CardTitle>Demo Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Demo Date</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Address / PIN</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>TSE</TableHead>
                  <TableHead>Washer Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Left</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No demo assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((demo) => {
                    const timeRemaining = getTimeRemaining(demo.demoDate);
                    const isUrgent = timeRemaining.hours < 3 && !timeRemaining.isOverdue;
                    const isEscalated = timeRemaining.isOverdue && !demo.washerAssigned && isToday(demo.demoDate);

                    return (
                      <TableRow key={demo.id} className={isEscalated ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">{demo.customerName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(demo.demoDate).toLocaleDateString('en-IN')}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{demo.timeSlot}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[150px]">{demo.serviceAddress}</span>
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">{demo.pinCode}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Car className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{demo.vehicle}</span>
                          </div>
                          <p className="text-xs text-gray-500">{demo.vehicleRegNo}</p>
                        </TableCell>
                        <TableCell className="text-sm">{demo.plan}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{demo.tseName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {demo.washerAssigned ? (
                            <div>
                              <p className="text-sm font-medium">{demo.washerAssigned}</p>
                              <p className="text-xs text-gray-500">
                                {demo.assignedAt && new Date(demo.assignedAt).toLocaleTimeString('en-IN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEscalated ? (
                            <Badge variant="destructive">
                              Washer Not Assigned - ESCALATED
                            </Badge>
                          ) : (
                            <Badge 
                              variant={demo.assignmentStatus === "Assigned" ? "default" : "secondary"}
                            >
                              {demo.assignmentStatus}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!demo.washerAssigned && !timeRemaining.isOverdue ? (
                            <div className={`text-sm ${isUrgent ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                              {timeRemaining.hours}h {timeRemaining.minutes}m
                            </div>
                          ) : timeRemaining.isOverdue ? (
                            <span className="text-xs text-red-600 font-bold">OVERDUE</span>
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!demo.washerAssigned && (
                            <Button
                              size="sm"
                              onClick={() => setShowAssignModal(demo.id)}
                              className="bg-teal-600 hover:bg-teal-700"
                            >
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
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
            <div className="bg-teal-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Assign Washer</h3>
              <button onClick={() => setShowAssignModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {(() => {
                  const demo = assignments.find(d => d.id === showAssignModal);
                  return (
                    <div className="space-y-2 text-sm">
                      <p><strong>Customer:</strong> {demo?.customerName}</p>
                      <p><strong>Date & Time:</strong> {demo?.demoDate} • {demo?.timeSlot}</p>
                      <p><strong>Vehicle:</strong> {demo?.vehicle} ({demo?.vehicleRegNo})</p>
                      <p><strong>Address:</strong> {demo?.serviceAddress}</p>
                      {demo?.specialInstructions && (
                        <p className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                          <strong>Instructions:</strong> {demo.specialInstructions}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <h4 className="font-semibold mb-4">Available Washers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_WASHERS.map((washer) => (
                  <div
                    key={washer.id}
                    className={`p-4 border-2 rounded-lg ${
                      washer.isAvailable 
                        ? 'border-gray-200 hover:border-teal-400 cursor-pointer' 
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{washer.name}</p>
                        <p className="text-sm text-gray-600">Zone: {washer.zone}</p>
                      </div>
                      {washer.isAvailable ? (
                        <Badge variant="outline" className="text-xs">Available</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Busy</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Jobs assigned today: {washer.jobsAssignedToday}
                    </p>
                    <Button
                      size="sm"
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      disabled={!washer.isAvailable}
                      onClick={() => handleAssignWasher(showAssignModal!, washer.name)}
                    >
                      Assign {washer.name}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
