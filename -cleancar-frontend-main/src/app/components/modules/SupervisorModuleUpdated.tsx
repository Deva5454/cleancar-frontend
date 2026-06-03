// Supervisor Module - Updated to align with Car Washer Module data
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  FileText,
  Briefcase,
  Camera,
  ClipboardCheck,
  AlertTriangle,
  Package,
  AlertCircle,
  Car,
  Play,
  Phone,
  Wrench,
  TrendingUp,
  Eye,
} from "lucide-react";
import { BackButton } from "../ui/back-button";
import { toast } from "sonner";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import { useCity } from "../../contexts/CityContext";

interface Job {
  id: string;
  timeSlot: string;
  customerFirstName: string;
  area: string;
  pinCode: string;
  city: string;
  addressLine1?: string;
  vehicleCategory: string;
  vehicleColor: string;
  vehicleBrand: string;
  vehicleRegistration: string;
  packageName: string;
  packageType: string;
  serviceFrequency: string;
  subscriptionMonth: string;
  complimentaryBenefits?: string;
  jobType: "Regular" | "One-Time Demo" | "Subscription Demo";
  status: "Assigned" | "Acknowledged" | "In Progress" | "Completed" | "Cancelled";
  specialInstructions?: string;
  specialNotes?: string;
  startingSoon?: boolean;
  overdue?: boolean;
  washerAssigned: string;
}

interface EquipmentIssue {
  id: string;
  washer: string;
  equipmentName: string;
  equipmentId: string;
  issueType: string;
  description: string;
  isUrgent: boolean;
  reportedAt: string;
  status: "Pending" | "Acknowledged" | "Resolved";
}

interface StockReplenishmentRequest {
  id: string;
  washer: string;
  materialName: string;
  currentBalance: number;
  requestedQty: number;
  unit: string;
  urgency: "Low" | "Medium" | "High";
  requestedAt: string;
  status: "Pending" | "Approved" | "Rejected" | "Issued";
}

export function SupervisorModuleUpdated() {
  const { city } = useCity();
  const cityWashers = employeeDatabaseService.getAll().filter(e => e.role==="Car Washer" && e.city===city);

  // State management
  const [selectedTab, setSelectedTab] = useState("jobs");
  const [siteVisitDialogOpen, setSiteVisitDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobDetailDialogOpen, setJobDetailDialogOpen] = useState(false);
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [washerFilter, setWasherFilter] = useState("all-washers");

  // Today's jobs for all washers under supervision
  const [todayJobs, setTodayJobs] = useState<Job[]>([
    {
      id: "J001",
      timeSlot: "05:00 - 05:30",
      customerFirstName: "Arjun",
      area: "Adajan",
      pinCode: "395009",
      city: "Surat",
      addressLine1: "B-204, Sigma Heights",
      vehicleCategory: "Mid-Size Sedan",
      vehicleColor: "White",
      vehicleBrand: "Honda",
      vehicleRegistration: "GJ-05-AB-1234",
      packageName: "Elite Wash",
      packageType: "Premium",
      serviceFrequency: "Daily",
      subscriptionMonth: "Month 3 of 6",
      complimentaryBenefits: "2 of 3 Interior Clean-Ups remaining",
      jobType: "Regular",
      status: "In Progress",
      specialInstructions: "Customer prefers no water near bonnet",
      specialNotes: "Basement parking — call customer on arrival.",
      washerAssigned: "Rahul Verma",
      startingSoon: false,
      overdue: false,
    },
    {
      id: "J002",
      timeSlot: "05:30 - 06:00",
      customerFirstName: "Priya",
      area: "Vesu",
      pinCode: "395007",
      city: "Surat",
      addressLine1: "A-101, Green Avenue",
      vehicleCategory: "Hatchback",
      vehicleColor: "Red",
      vehicleBrand: "Maruti",
      vehicleRegistration: "GJ-05-CD-5678",
      packageName: "Standard Wash",
      packageType: "Standard",
      serviceFrequency: "Alternate Days",
      subscriptionMonth: "Month 1 of 3",
      jobType: "Regular",
      status: "Assigned",
      washerAssigned: "Rahul Verma",
      startingSoon: true,
      overdue: false,
    },
    {
      id: "J003",
      timeSlot: "06:00 - 06:30",
      customerFirstName: "Rajesh",
      area: "Adajan West",
      pinCode: "395009",
      city: "Surat",
      addressLine1: "C-505, Royal Residency",
      vehicleCategory: "Mid/Large SUV",
      vehicleColor: "Black",
      vehicleBrand: "Toyota",
      vehicleRegistration: "GJ-05-EF-9012",
      packageName: "Premium Wash",
      packageType: "Premium",
      serviceFrequency: "Daily",
      subscriptionMonth: "Month 2 of 12",
      jobType: "Regular",
      status: "Completed",
      washerAssigned: "Rahul Verma",
      startingSoon: false,
      overdue: false,
    },
    {
      id: "J004",
      timeSlot: "05:00 - 05:30",
      customerFirstName: "Sneha",
      area: "Adajan",
      pinCode: "395009",
      city: "Surat",
      vehicleCategory: "Compact SUV",
      vehicleColor: "Silver",
      vehicleBrand: "Hyundai",
      vehicleRegistration: "GJ-05-GH-3456",
      packageName: "Standard Wash",
      packageType: "Standard",
      serviceFrequency: "Daily",
      subscriptionMonth: "Month 5 of 6",
      jobType: "Regular",
      status: "Assigned",
      washerAssigned: "Sunil Kumar",
      startingSoon: true,
      overdue: false,
    },
    {
      id: "J005",
      timeSlot: "04:30 - 05:00",
      customerFirstName: "Vikram",
      area: "Vesu",
      pinCode: "395007",
      city: "Surat",
      vehicleCategory: "Luxury Sedan",
      vehicleColor: "Black",
      vehicleBrand: "BMW",
      vehicleRegistration: "GJ-05-IJ-7890",
      packageName: "Premium Plus",
      packageType: "Premium",
      serviceFrequency: "Daily",
      subscriptionMonth: "Month 2 of 12",
      jobType: "Regular",
      status: "Completed",
      washerAssigned: "Sunil Kumar",
      startingSoon: false,
      overdue: false,
    },
  ]);

  // Equipment issues reported by washers
  const [equipmentIssues, setEquipmentIssues] = useState<EquipmentIssue[]>([
    {
      id: "EI-001",
      washer: "Rahul Verma",
      equipmentName: "Pressure Washer",
      equipmentId: "EQ-001",
      issueType: "Performance Degraded",
      description: "Pressure is lower than normal, taking longer to clean",
      isUrgent: false,
      reportedAt: "Mar 17, 2026 05:15 AM",
      status: "Pending",
    },
    {
      id: "EI-002",
      washer: "Dinesh Pal",
      equipmentName: "Vacuum Cleaner",
      equipmentId: "EQ-004",
      issueType: "Not Working",
      description: "Motor not starting, no power",
      isUrgent: true,
      reportedAt: "Mar 17, 2026 04:50 AM",
      status: "Acknowledged",
    },
  ]);

  // Stock replenishment requests
  const [stockRequests, setStockRequests] = useState<StockReplenishmentRequest[]>([
    {
      id: "SR-001",
      washer: "Rahul Verma",
      materialName: "Car Wash Shampoo 5L",
      currentBalance: 2.5,
      requestedQty: 5,
      unit: "Ltr",
      urgency: "High",
      requestedAt: "Mar 16, 2026 08:30 PM",
      status: "Pending",
    },
    {
      id: "SR-002",
      washer: "Sunil Kumar",
      materialName: "Microfiber Cloth",
      currentBalance: 5,
      requestedQty: 10,
      unit: "Pcs",
      urgency: "Medium",
      requestedAt: "Mar 16, 2026 07:15 PM",
      status: "Approved",
    },
  ]);

  // Team attendance with clock in/out
  const [teamAttendance] = useState([
    {
      id: 1,
      washer: "Rahul Verma",
      checkIn: "04:05 AM",
      checkOut: "In Progress",
      status: "Present",
      jobsCompleted: 1,
      jobsInProgress: 1,
      jobsAssigned: 3,
      pinCode: "395009",
      areaName: "Adajan",
      clockInLocation: "Adajan Circle",
    },
    {
      id: 2,
      washer: "Sunil Kumar",
      checkIn: "04:15 AM",
      checkOut: "In Progress",
      status: "Present",
      jobsCompleted: 1,
      jobsInProgress: 0,
      jobsAssigned: 2,
      pinCode: "395007",
      areaName: "Vesu",
      clockInLocation: "Vesu Main Road",
    },
    {
      id: 3,
      washer: "Dinesh Pal",
      checkIn: "-",
      checkOut: "-",
      status: "Absent",
      jobsCompleted: 0,
      jobsInProgress: 0,
      jobsAssigned: 0,
      pinCode: "395009",
      areaName: "Adajan",
      clockInLocation: "-",
    },
    {
      id: 4,
      washer: "Mohan Singh",
      checkIn: "04:35 AM",
      checkOut: "In Progress",
      status: "Late",
      jobsCompleted: 0,
      jobsInProgress: 0,
      jobsAssigned: 2,
      pinCode: "395006",
      areaName: "Jahangirpura",
      clockInLocation: "Jahangirpura Gate",
    },
  ]);

  const [pendingLeaves, setPendingLeaves] = useState([
    {
      id: 1,
      employee: "Rahul Verma",
      type: "CL",
      dates: "Mar 20-21, 2026",
      days: 2,
      reason: "Family function",
      status: "Pending",
      appliedOn: "Mar 16, 2026",
    },
    {
      id: 2,
      employee: "Sunil Kumar",
      type: "SL",
      dates: "Mar 18, 2026",
      days: 1,
      reason: "Fever",
      status: "Pending",
      appliedOn: "Mar 16, 2026",
    },
  ]);

  const handleLeaveAction = (leaveId: number, action: "approve" | "reject") => {
    setPendingLeaves((prev) =>
      prev.map((leave) =>
        leave.id === leaveId
          ? {
              ...leave,
              status: action === "approve" ? "Approved" : "Rejected",
            }
          : leave
      )
    );
    toast.success(
      action === "approve" ? "Leave approved!" : "Leave rejected"
    );
  };

  const handleEquipmentIssueAction = (issueId: string, action: "acknowledge" | "resolve") => {
    setEquipmentIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              status: action === "acknowledge" ? "Acknowledged" : "Resolved",
            }
          : issue
      )
    );
    toast.success(
      action === "acknowledge"
        ? "Equipment issue acknowledged"
        : "Equipment issue marked as resolved"
    );
  };

  const handleStockRequestAction = (requestId: string, action: "approve" | "reject") => {
    setStockRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: action === "approve" ? "Approved" : "Rejected",
            }
          : request
      )
    );
    toast.success(
      action === "approve"
        ? "Stock replenishment approved"
        : "Stock request rejected"
    );
  };

  const handleViewJobDetails = (job: Job) => {
    setSelectedJob(job);
    setJobDetailDialogOpen(true);
  };

  const handleCallWasher = (washerName: string) => {
    toast.success(`Calling ${washerName}...`, {
      description: "Initiating call",
    });
  };

  const handleExportReport = () => {
    toast.success("Report exported successfully", {
      description: "Downloaded to your device",
    });
  };

  const handleViewIssuesClick = () => {
    setSelectedTab("equipment");
    toast.info("Showing equipment issues");
  };

  const handleReviewRequestsClick = () => {
    setSelectedTab("stock");
    toast.info("Showing stock requests");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Assigned":
        return "bg-blue-100 text-blue-700";
      case "In Progress":
        return "bg-amber-100 text-amber-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case "One-Time Demo":
        return "bg-amber-100 text-amber-700";
      case "Subscription Demo":
        return "bg-teal-100 text-teal-700";
      case "Regular":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Calculate stats
  const totalJobs = todayJobs.length;
  const completedJobs = todayJobs.filter((j) => j.status === "Completed").length;
  const inProgressJobs = todayJobs.filter((j) => j.status === "In Progress").length;
  const assignedJobs = todayJobs.filter((j) => j.status === "Assigned").length;
  const presentWashers = teamAttendance.filter((w) => w.status === "Present").length;
  const totalWashers = teamAttendance.length;

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time team oversight & job tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSiteVisitDialogOpen(true)}
          >
            <Camera className="w-4 h-4 mr-2" />
            Log Site Visit
          </Button>
          <Button
            size="sm"
            onClick={() => setAuditDialogOpen(true)}
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Quality Audit
          </Button>
        </div>
      </div>

      {/* Alert Banners */}
      <div className="space-y-3">
        {equipmentIssues.filter((i) => i.isUrgent && i.status === "Pending").length > 0 && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">
                    Urgent Equipment Issue Reported
                  </p>
                  <p className="text-sm text-red-700">
                    {equipmentIssues.filter((i) => i.isUrgent && i.status === "Pending").length}{" "}
                    critical equipment issue(s) need immediate attention
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  onClick={handleViewIssuesClick}
                >
                  View Issues
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stockRequests.filter((r) => r.status === "Pending" && r.urgency === "High").length >
          0 && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Package className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900">
                    Stock Replenishment Requests Pending
                  </p>
                  <p className="text-sm text-amber-700">
                    {stockRequests.filter((r) => r.status === "Pending").length} request(s)
                    awaiting approval
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={handleReviewRequestsClick}
                >
                  Review Requests
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Team Attendance</p>
                <p className="text-2xl font-bold mt-1">
                  {presentWashers}/{totalWashers}
                </p>
                <p className="text-xs text-gray-500 mt-1">Present today</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold mt-1">{totalJobs}</p>
                <p className="text-xs text-gray-500 mt-1">Scheduled today</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{completedJobs}</p>
                <p className="text-xs text-gray-500 mt-1">Jobs finished</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{inProgressJobs}</p>
                <p className="text-xs text-gray-500 mt-1">Active now</p>
              </div>
              <div className="bg-amber-50 text-amber-600 p-3 rounded-lg">
                <Play className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">
                  {pendingLeaves.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Leave requests</p>
              </div>
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Today's Jobs ({totalJobs})</TabsTrigger>
          <TabsTrigger value="attendance">Team Attendance</TabsTrigger>
          <TabsTrigger value="equipment">
            Equipment Issues ({equipmentIssues.filter((i) => i.status !== "Resolved").length})
          </TabsTrigger>
          <TabsTrigger value="stock">
            Stock Requests ({stockRequests.filter((r) => r.status === "Pending").length})
          </TabsTrigger>
          <TabsTrigger value="leaves">Leave Approvals ({pendingLeaves.length})</TabsTrigger>
        </TabsList>

        {/* Today's Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">All Jobs - March 17, 2026</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="all" onValueChange={setJobStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all-washers" onValueChange={setWasherFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-washers">All Washers</SelectItem>
                      {cityWashers.map(w=>(
                        <SelectItem key={w.employeeId} value={w.employeeId}>{w.firstName} {w.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Washer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayJobs
                    .filter(
                      (job) =>
                        (jobStatusFilter === "all" || job.status === jobStatusFilter) &&
                        (washerFilter === "all-washers" || job.washerAssigned === washerFilter)
                    )
                    .map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-sm">{job.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm">{job.timeSlot}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{job.customerFirstName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Car className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm">{job.vehicleBrand}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                              {job.vehicleRegistration}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm">{job.area}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{job.packageName}</p>
                            <Badge variant="outline" className="text-xs">
                              {job.jobType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{job.washerAssigned}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(job.status)}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewJobDetails(job)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Attendance - Today</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Washer</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jobs Progress</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.washer}</TableCell>
                      <TableCell>{record.checkIn}</TableCell>
                      <TableCell>{record.checkOut}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "Present"
                              ? "secondary"
                              : record.status === "Absent"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {record.status === "Present" && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {record.status === "Absent" && (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {record.status === "Late" && <Clock className="w-3 h-3 mr-1" />}
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600 font-medium">
                              {record.jobsCompleted} Done
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-amber-600 font-medium">
                              {record.jobsInProgress} In Progress
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-blue-600 font-medium">
                              {record.jobsAssigned} Total
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {record.areaName}
                          </div>
                          <p className="text-xs text-gray-500">{record.clockInLocation}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => handleCallWasher(record.washer)}>
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Issues Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equipment Issues Reported</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {equipmentIssues.map((issue) => (
                  <Card key={issue.id} className={issue.isUrgent ? "border-red-300" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {issue.isUrgent && (
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-gray-400" />
                                <p className="font-semibold">{issue.equipmentName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {issue.equipmentId}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Reported by: {issue.washer}
                              </p>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  issue.issueType === "Not Working"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }
                              >
                                {issue.issueType}
                              </Badge>
                              {issue.isUrgent && (
                                <Badge className="bg-red-100 text-red-700">
                                  Cannot Continue Without This
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{issue.description}</p>
                            <p className="text-xs text-gray-500">{issue.reportedAt}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                issue.status === "Resolved"
                                  ? "bg-green-100 text-green-700"
                                  : issue.status === "Acknowledged"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }
                            >
                              {issue.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {issue.status === "Pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleEquipmentIssueAction(issue.id, "acknowledge")
                                }
                              >
                                Acknowledge
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleEquipmentIssueAction(issue.id, "resolve")}
                              >
                                Mark Resolved
                              </Button>
                            </>
                          )}
                          {issue.status === "Acknowledged" && (
                            <Button
                              size="sm"
                              onClick={() => handleEquipmentIssueAction(issue.id, "resolve")}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {equipmentIssues.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No equipment issues reported</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Replenishment Requests Tab */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stock Replenishment Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Package className="w-5 h-5 text-teal-600" />
                            <div>
                              <p className="font-semibold">{request.materialName}</p>
                              <p className="text-sm text-gray-600">
                                Requested by: {request.washer}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div className="bg-red-50 rounded p-3">
                              <p className="text-xs text-gray-600">Current Balance</p>
                              <p className="text-lg font-bold text-red-600">
                                {request.currentBalance} {request.unit}
                              </p>
                            </div>
                            <div className="bg-blue-50 rounded p-3">
                              <p className="text-xs text-gray-600">Requested Qty</p>
                              <p className="text-lg font-bold text-blue-600">
                                {request.requestedQty} {request.unit}
                              </p>
                            </div>
                            <div className="bg-amber-50 rounded p-3">
                              <p className="text-xs text-gray-600">Urgency</p>
                              <Badge
                                className={
                                  request.urgency === "High"
                                    ? "bg-red-100 text-red-700"
                                    : request.urgency === "Medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                                }
                              >
                                {request.urgency}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <p className="text-xs text-gray-500">{request.requestedAt}</p>
                            <Badge
                              className={
                                request.status === "Approved"
                                  ? "bg-green-100 text-green-700"
                                  : request.status === "Rejected"
                                  ? "bg-red-100 text-red-700"
                                  : request.status === "Issued"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>
                        </div>

                        {request.status === "Pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStockRequestAction(request.id, "reject")
                              }
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleStockRequestAction(request.id, "approve")
                              }
                            >
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {stockRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No stock replenishment requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Approvals Tab */}
        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Leave Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLeaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">{leave.employee}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{leave.type}</Badge>
                      </TableCell>
                      <TableCell>{leave.dates}</TableCell>
                      <TableCell>{leave.days}</TableCell>
                      <TableCell>{leave.reason}</TableCell>
                      <TableCell>{leave.appliedOn}</TableCell>
                      <TableCell>
                        {leave.status === "Pending" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLeaveAction(leave.id, "reject")}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleLeaveAction(leave.id, "approve")}
                            >
                              Approve
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            className={
                              leave.status === "Approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {leave.status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Detail Dialog */}
      <Dialog open={jobDetailDialogOpen} onOpenChange={setJobDetailDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details - {selectedJob?.id}</DialogTitle>
            <DialogDescription>
              Complete job information for supervisor review
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Status and Type */}
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadgeColor(selectedJob.status)}>
                  {selectedJob.status}
                </Badge>
                <Badge className={getJobTypeColor(selectedJob.jobType)}>
                  {selectedJob.jobType}
                </Badge>
                <Badge variant="outline">{selectedJob.timeSlot}</Badge>
              </div>

              {/* Customer Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <p className="font-semibold">Customer Information</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{selectedJob.customerFirstName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedJob.addressLine1 && `${selectedJob.addressLine1}, `}
                      {selectedJob.area}, {selectedJob.city} - {selectedJob.pinCode}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-teal-600" />
                    <p className="font-semibold">Vehicle Details</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="text-sm font-medium">{selectedJob.vehicleCategory}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Color</p>
                      <p className="text-sm font-medium">{selectedJob.vehicleColor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Brand</p>
                      <p className="text-sm font-medium">{selectedJob.vehicleBrand}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Registration</p>
                      <p className="text-sm font-medium font-mono">
                        {selectedJob.vehicleRegistration}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Package Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-600" />
                    <p className="font-semibold">Package Details</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-teal-600">{selectedJob.packageName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedJob.packageType}</Badge>
                      <Badge variant="outline">{selectedJob.serviceFrequency}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedJob.subscriptionMonth}
                    </p>
                  </div>
                  {selectedJob.complimentaryBenefits && (
                    <div className="bg-teal-50 border border-teal-200 rounded p-3">
                      <p className="text-sm text-teal-900">
                        <strong>Benefit:</strong> {selectedJob.complimentaryBenefits}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Special Instructions */}
              {selectedJob.specialNotes && (
                <Card>
                  <CardContent className="p-4">
                    <div className="bg-amber-50 border border-amber-200 rounded p-3">
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        Special Instructions
                      </p>
                      <p className="text-sm text-amber-800">{selectedJob.specialNotes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Washer Assignment */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Assigned Washer</p>
                      <p className="text-lg font-bold">{selectedJob.washerAssigned}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleCallWasher(selectedJob.washerAssigned)}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call Washer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setJobDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Site Visit Dialog */}
      <Dialog open={siteVisitDialogOpen} onOpenChange={setSiteVisitDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Site Visit</DialogTitle>
            <DialogDescription>
              Record details of the site visit for quality assurance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Site Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <p className="font-semibold">Site Information</p>
                </div>
                <div>
                  <p className="text-lg font-bold">Adajan Circle</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Adajan, Surat - 395009
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Visit Details */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <p className="font-semibold">Visit Details</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <Input
                      type="date"
                      className="text-sm font-medium"
                      defaultValue="2026-03-17"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <Input
                      type="time"
                      className="text-sm font-medium"
                      defaultValue="05:00"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Visited By</p>
                    <Input
                      type="text"
                      className="text-sm font-medium"
                      defaultValue="Rahul Verma"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observations */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <p className="font-semibold">Observations</p>
                </div>
                <Textarea
                  className="text-sm font-medium"
                  placeholder="Enter your observations here..."
                />
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  <p className="font-semibold">Recommendations</p>
                </div>
                <Textarea
                  className="text-sm font-medium"
                  placeholder="Enter your recommendations here..."
                />
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setSiteVisitDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quality Audit Dialog */}
      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quality Audit</DialogTitle>
            <DialogDescription>
              Conduct a quality audit for the car wash service
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Site Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <p className="font-semibold">Site Information</p>
                </div>
                <div>
                  <p className="text-lg font-bold">Adajan Circle</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Adajan, Surat - 395009
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Audit Details */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <p className="font-semibold">Audit Details</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <Input
                      type="date"
                      className="text-sm font-medium"
                      defaultValue="2026-03-17"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <Input
                      type="time"
                      className="text-sm font-medium"
                      defaultValue="05:00"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Audited By</p>
                    <Input
                      type="text"
                      className="text-sm font-medium"
                      defaultValue="Rahul Verma"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observations */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <p className="font-semibold">Observations</p>
                </div>
                <Textarea
                  className="text-sm font-medium"
                  placeholder="Enter your observations here..."
                />
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  <p className="font-semibold">Recommendations</p>
                </div>
                <Textarea
                  className="text-sm font-medium"
                  placeholder="Enter your recommendations here..."
                />
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setAuditDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}