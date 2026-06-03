// Confirmation Letter System with Probation Tracking & Approval Workflow
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  FileCheck,
  X,
  Eye,
  Send,
  Download,
  Printer,
  Search,
  Filter,
  Bell,
  CalendarClock,
  ShieldCheck,
  MessageSquare,
  Plus,
  ChevronRight,
  User,
  CreditCard,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import type { EmployeeDatabaseRecord } from "../../services/employeeDatabaseService";
import { useNavigate } from "react-router-dom";

type ConfirmationStatus =
  | "Pending Initiation"
  | "Pending Manager Approval"
  | "Pending HR Review"
  | "Pending Admin Approval"
  | "Confirmed"
  | "Extended"
  | "Terminated";

interface ConfirmationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  reportingManager: string;
  joiningDate: string;
  probationPeriod: string; // e.g., "3 months", "6 months"
  probationEndDate: string;
  daysUntilProbationEnd: number;
  status: ConfirmationStatus;
  initiatedBy?: string;
  initiatedOn?: string;
  managerApprovalBy?: string;
  managerApprovalOn?: string;
  managerComments?: string;
  hrReviewBy?: string;
  hrReviewOn?: string;
  hrComments?: string;
  adminApprovalBy?: string;
  adminApprovalOn?: string;
  confirmationLetterIssued?: boolean;
  confirmationLetterDate?: string;
  extensionPeriod?: string;
  terminationReason?: string;
}

interface NotificationItem {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "30-day" | "15-day" | "overdue";
  message: string;
  priority: "high" | "medium" | "low";
  createdDate: string;
}

// Calculate days between two dates
const calculateDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Calculate probation end date
const calculateProbationEndDate = (joiningDate: string, probationMonths: number = 3): string => {
  const date = new Date(joiningDate);
  date.setMonth(date.getMonth() + probationMonths);
  return date.toISOString().split("T")[0];
};

// Parse probation period string to number of months
const parseProbationMonths = (probationPeriod: string): number => {
  const match = probationPeriod.match(/(\d+)\s*month/i);
  return match ? parseInt(match[1], 10) : 3; // Default to 3 months if parsing fails
};

// Generate confirmation records from live employee database
const generateConfirmationRecords = (): ConfirmationRecord[] => {
  const today = new Date().toISOString().split("T")[0];
  const liveEmployees = employeeDatabaseService.getAll();

  return liveEmployees
    .filter(emp => emp.status === "Active" && emp.employmentStage !== "Not Converted")
    .map(emp => {
      const probationMonths = parseProbationMonths(emp.probationPeriod);
      const probationEndDate = calculateProbationEndDate(emp.dateOfJoining, probationMonths);
      const daysUntil = calculateDaysDifference(today, probationEndDate);

      let status: ConfirmationStatus = "Pending Initiation";
      if (daysUntil <= 30 && daysUntil > 15) {
        status = "Pending Manager Approval";
      } else if (daysUntil <= 15 && daysUntil > 0) {
        status = "Pending HR Review";
      }

      return {
        id: `CONF-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        designation: emp.designation,
        department: emp.department,
        reportingManager: emp.reportingManager,
        joiningDate: emp.dateOfJoining,
        probationPeriod: emp.probationPeriod,
        probationEndDate,
        daysUntilProbationEnd: daysUntil,
        status,
      };
    });
};

export function ConfirmationLetterSystem() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ConfirmationRecord[]>(generateConfirmationRecords());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ConfirmationRecord | null>(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [currentApprovalAction, setCurrentApprovalAction] = useState<"approve" | "extend" | "terminate">("approve");
  const [showPostIssueCard, setShowPostIssueCard] = useState<string | null>(null);

  // Subscribe to employee database changes
  useEffect(() => {
    const unsubscribe = employeeDatabaseService.subscribe(() => {
      setRecords(generateConfirmationRecords());
    });

    return unsubscribe;
  }, []);

  // Generate notifications based on probation end dates
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const newNotifications: NotificationItem[] = [];

    records.forEach(record => {
      const days = record.daysUntilProbationEnd;

      // 30-day notification for HR
      if (days === 30) {
        newNotifications.push({
          id: `NOTIF-30-${record.employeeId}`,
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          type: "30-day",
          message: `Probation ending in 30 days - Initiate confirmation process`,
          priority: "medium",
          createdDate: today,
        });
      }

      // 15-day notification for hierarchy
      if (days === 15) {
        newNotifications.push({
          id: `NOTIF-15-${record.employeeId}`,
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          type: "15-day",
          message: `URGENT: Probation ending in 15 days - Manager approval pending`,
          priority: "high",
          createdDate: today,
        });
      }

      // Overdue notification
      if (days < 0 && record.status !== "Confirmed") {
        newNotifications.push({
          id: `NOTIF-OD-${record.employeeId}`,
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          type: "overdue",
          message: `OVERDUE: Probation period ended ${Math.abs(days)} days ago!`,
          priority: "high",
          createdDate: today,
        });
      }
    });

    setNotifications(newNotifications);
  }, [records]);

  const getStatusColor = (status: ConfirmationStatus) => {
    switch (status) {
      case "Pending Initiation":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "Pending Manager Approval":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Pending HR Review":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Pending Admin Approval":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Confirmed":
        return "bg-green-100 text-green-800 border-green-300";
      case "Extended":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Terminated":
        return "bg-red-100 text-red-800 border-red-300";
    }
  };

  const getDaysColor = (days: number) => {
    if (days < 0) return "text-red-600 font-bold";
    if (days <= 15) return "text-orange-600 font-semibold";
    if (days <= 30) return "text-yellow-600 font-medium";
    return "text-gray-600";
  };

  const handleInitiateConfirmation = (record: ConfirmationRecord) => {
    const updatedRecords = records.map(r =>
      r.id === record.id
        ? {
            ...r,
            status: "Pending Manager Approval" as ConfirmationStatus,
            initiatedBy: "Neeta Sharma (HR)",
            initiatedOn: new Date().toISOString().split("T")[0],
          }
        : r
    );
    setRecords(updatedRecords);
    toast.success(`✅ Confirmation process initiated for ${record.employeeName}\n\nNotification sent to ${record.reportingManager}`);
  };

  const handleManagerApproval = () => {
    if (!selectedRecord) return;

    const today = new Date().toISOString().split("T")[0];
    
    if (currentApprovalAction === "approve") {
      const updatedRecords = records.map(r =>
        r.id === selectedRecord.id
          ? {
              ...r,
              status: "Pending HR Review" as ConfirmationStatus,
              managerApprovalBy: selectedRecord.reportingManager,
              managerApprovalOn: today,
              managerComments: approvalComments || "Recommended for confirmation",
            }
          : r
      );
      setRecords(updatedRecords);
      toast.success(`✅ Manager Approved\n\n${selectedRecord.employeeName} - Moved to HR Review`);
    } else if (currentApprovalAction === "extend") {
      const updatedRecords = records.map(r =>
        r.id === selectedRecord.id
          ? {
              ...r,
              status: "Extended" as ConfirmationStatus,
              managerApprovalBy: selectedRecord.reportingManager,
              managerApprovalOn: today,
              managerComments: approvalComments || "Probation extended",
              extensionPeriod: "3 months",
            }
          : r
      );
      setRecords(updatedRecords);
      toast.info(`⏰ Probation Extended\n\n${selectedRecord.employeeName} - Extended by 3 months`);
    }

    setShowApprovalModal(false);
    setApprovalComments("");
  };

  const handleHRReview = (record: ConfirmationRecord) => {
    const today = new Date().toISOString().split("T")[0];
    const updatedRecords = records.map(r =>
      r.id === record.id
        ? {
            ...r,
            status: "Pending Admin Approval" as ConfirmationStatus,
            hrReviewBy: "Neeta Sharma (HR)",
            hrReviewOn: today,
            hrComments: "All documents verified. Recommended for confirmation.",
          }
        : r
    );
    setRecords(updatedRecords);
    toast.success(`✅ HR Review Complete\n\n${record.employeeName} - Forwarded to Admin for final approval`);
  };

  const handleAdminApproval = (record: ConfirmationRecord) => {
    const today = new Date().toISOString().split("T")[0];
    const updatedRecords = records.map(r =>
      r.id === record.id
        ? {
            ...r,
            status: "Confirmed" as ConfirmationStatus,
            adminApprovalBy: "Rajesh Patel (Admin)",
            adminApprovalOn: today,
            confirmationLetterIssued: true,
            confirmationLetterDate: today,
          }
        : r
    );
    setRecords(updatedRecords);

    // Write confirmationDate to employee record in employeeDatabaseService
    const allEmployees = employeeDatabaseService.getAll();
    const employee = allEmployees.find(
      (emp) => emp.id === record.employeeId || emp.tempId === record.employeeId
    );
    if (employee) {
      employeeDatabaseService.update(employee.id, {
        confirmationDate: today,
        journeyStage: 9,
        journeyStageName: "Confirmed",
      });
    }

    // Show post-issue card and auto-dismiss after 15 seconds
    setShowPostIssueCard(record.id);
    setTimeout(() => setShowPostIssueCard(null), 15000);

    toast.success(`🎉 Employee Confirmed!\n\n${record.employeeName} - Confirmation letter issued`);
  };

  const handleGenerateIDCard = (record: ConfirmationRecord) => {
    // Navigate to ID Card Generator - employee will now be in Confirmed group
    navigate("/hr/id-card-generator");
    toast.success(`Navigated to ID Card Generator — ${record.employeeName} is now in the Confirmed group`);
  };

  const handleViewEmployeeRecord = (record: ConfirmationRecord) => {
    // Navigate to Employee Ledger with Journey Tracker expanded
    sessionStorage.setItem("selectedEmployeeId", record.employeeId);
    sessionStorage.setItem("expandJourneyTracker", "true");
    navigate("/hr/employee-ledger");
    toast.success(`Viewing ${record.employeeName}'s record with Journey Tracker expanded`);
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || record.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Separate records by urgency
  const urgentRecords = filteredRecords.filter(r => r.daysUntilProbationEnd <= 15 && r.status !== "Confirmed");
  const upcomingRecords = filteredRecords.filter(r => r.daysUntilProbationEnd > 15 && r.daysUntilProbationEnd <= 30);
  const normalRecords = filteredRecords.filter(r => r.daysUntilProbationEnd > 30);
  const confirmedRecords = filteredRecords.filter(r => r.status === "Confirmed");

  // Count stats
  const pendingManagerApproval = records.filter(r => r.status === "Pending Manager Approval").length;
  const pendingHRReview = records.filter(r => r.status === "Pending HR Review").length;
  const pendingAdminApproval = records.filter(r => r.status === "Pending Admin Approval").length;
  const totalConfirmed = records.filter(r => r.status === "Confirmed").length;

  return (
    <div className="space-y-6">
      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {notifications.length} Active Notification{notifications.length !== 1 ? "s" : ""}
                </h4>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map(notif => (
                    <div
                      key={notif.id}
                      className={`p-2 rounded border ${
                        notif.priority === "high"
                          ? "bg-red-100 border-red-300"
                          : "bg-yellow-100 border-yellow-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{notif.employeeName}</span>
                          <span className="text-sm ml-2">- {notif.message}</span>
                        </div>
                        <Badge
                          className={
                            notif.priority === "high"
                              ? "bg-red-600 text-white"
                              : "bg-yellow-600 text-white"
                          }
                        >
                          {notif.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {notifications.length > 3 && (
                  <p className="text-xs text-red-700 mt-2">
                    +{notifications.length - 3} more notifications
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500">Pending Manager</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingManagerApproval}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <UserCheck className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Pending HR</p>
                <p className="text-2xl font-bold text-blue-600">{pendingHRReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <ShieldCheck className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Pending Admin</p>
                <p className="text-2xl font-bold text-purple-600">{pendingAdminApproval}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{totalConfirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by employee name, ID, or designation..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending Manager Approval">Pending Manager</SelectItem>
                <SelectItem value="Pending HR Review">Pending HR</SelectItem>
                <SelectItem value="Pending Admin Approval">Pending Admin</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Extended">Extended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Urgent - Probation Ending in 15 Days or Less */}
      {urgentRecords.length > 0 && (
        <Card className="border-2 border-red-300">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-5 h-5" />
              URGENT - Probation Ending ≤ 15 Days ({urgentRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ProbationTable
              records={urgentRecords}
              onInitiate={handleInitiateConfirmation}
              onManagerApproval={(record) => {
                setSelectedRecord(record);
                setShowApprovalModal(true);
              }}
              onHRReview={handleHRReview}
              onAdminApproval={handleAdminApproval}
              onPreview={(record) => {
                setSelectedRecord(record);
                setShowPreviewModal(true);
              }}
              getDaysColor={getDaysColor}
              getStatusColor={getStatusColor}
              showPostIssueCard={showPostIssueCard}
              onGenerateIDCard={handleGenerateIDCard}
              onViewEmployeeRecord={handleViewEmployeeRecord}
            />
          </CardContent>
        </Card>
      )}

      {/* Upcoming - Probation Ending in 16-30 Days */}
      {upcomingRecords.length > 0 && (
        <Card className="border-2 border-yellow-300">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <CalendarClock className="w-5 h-5" />
              Upcoming - Probation Ending in 16-30 Days ({upcomingRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ProbationTable
              records={upcomingRecords}
              onInitiate={handleInitiateConfirmation}
              onManagerApproval={(record) => {
                setSelectedRecord(record);
                setShowApprovalModal(true);
              }}
              onHRReview={handleHRReview}
              onAdminApproval={handleAdminApproval}
              onPreview={(record) => {
                setSelectedRecord(record);
                setShowPreviewModal(true);
              }}
              getDaysColor={getDaysColor}
              getStatusColor={getStatusColor}
              showPostIssueCard={showPostIssueCard}
              onGenerateIDCard={handleGenerateIDCard}
              onViewEmployeeRecord={handleViewEmployeeRecord}
            />
          </CardContent>
        </Card>
      )}

      {/* Normal - Probation Ending > 30 Days */}
      {normalRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Normal - Probation Ending &gt; 30 Days ({normalRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ProbationTable
              records={normalRecords}
              onInitiate={handleInitiateConfirmation}
              onManagerApproval={(record) => {
                setSelectedRecord(record);
                setShowApprovalModal(true);
              }}
              onHRReview={handleHRReview}
              onAdminApproval={handleAdminApproval}
              onPreview={(record) => {
                setSelectedRecord(record);
                setShowPreviewModal(true);
              }}
              getDaysColor={getDaysColor}
              getStatusColor={getStatusColor}
              showPostIssueCard={showPostIssueCard}
              onGenerateIDCard={handleGenerateIDCard}
              onViewEmployeeRecord={handleViewEmployeeRecord}
            />
          </CardContent>
        </Card>
      )}

      {/* Confirmed Employees */}
      {confirmedRecords.length > 0 && (
        <Card className="border-2 border-green-300">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="w-5 h-5" />
              Confirmed Employees ({confirmedRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ProbationTable
              records={confirmedRecords}
              onInitiate={handleInitiateConfirmation}
              onManagerApproval={(record) => {
                setSelectedRecord(record);
                setShowApprovalModal(true);
              }}
              onHRReview={handleHRReview}
              onAdminApproval={handleAdminApproval}
              onPreview={(record) => {
                setSelectedRecord(record);
                setShowPreviewModal(true);
              }}
              getDaysColor={getDaysColor}
              getStatusColor={getStatusColor}
              showPostIssueCard={showPostIssueCard}
              onGenerateIDCard={handleGenerateIDCard}
              onViewEmployeeRecord={handleViewEmployeeRecord}
            />
          </CardContent>
        </Card>
      )}

      {/* Manager Approval Modal */}
      {showApprovalModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Manager Approval - {selectedRecord.employeeName}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalComments("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Employee Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Name:</strong> {selectedRecord.employeeName}</div>
                  <div><strong>Designation:</strong> {selectedRecord.designation}</div>
                  <div><strong>Department:</strong> {selectedRecord.department}</div>
                  <div><strong>Joining Date:</strong> {new Date(selectedRecord.joiningDate).toLocaleDateString("en-IN")}</div>
                  <div>
                    <strong>Probation End:</strong> {new Date(selectedRecord.probationEndDate).toLocaleDateString("en-IN")}
                    <span className="text-xs text-gray-500 ml-2">
                      ({selectedRecord.probationPeriod})
                    </span>
                  </div>
                  <div>
                    <strong>Days Remaining:</strong>{" "}
                    <span className={getDaysColor(selectedRecord.daysUntilProbationEnd)}>
                      {selectedRecord.daysUntilProbationEnd} days
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Action *</Label>
                <Select value={currentApprovalAction} onValueChange={(val) => setCurrentApprovalAction(val as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">✅ Approve for Confirmation</SelectItem>
                    <SelectItem value="extend">⏰ Extend Probation (3 months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Comments</Label>
                <Textarea
                  placeholder="Enter your comments or feedback..."
                  rows={4}
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={handleManagerApproval}
                  disabled={!approvalComments && currentApprovalAction !== "approve"}
                >
                  {currentApprovalAction === "approve" ? "✅ Approve" : "⏰ Extend Probation"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalComments("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Letter Preview Modal */}
      {showPreviewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl my-8">
            <CardHeader className="border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <CardTitle>Confirmation Letter Preview - {selectedRecord.id}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info("Print dialog opened")}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info("Download started")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <ConfirmationLetterTemplate record={selectedRecord} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Probation Table Component
interface ProbationTableProps {
  records: ConfirmationRecord[];
  onInitiate: (record: ConfirmationRecord) => void;
  onManagerApproval: (record: ConfirmationRecord) => void;
  onHRReview: (record: ConfirmationRecord) => void;
  onAdminApproval: (record: ConfirmationRecord) => void;
  onPreview: (record: ConfirmationRecord) => void;
  getDaysColor: (days: number) => string;
  getStatusColor: (status: ConfirmationStatus) => string;
  showPostIssueCard: string | null;
  onGenerateIDCard: (record: ConfirmationRecord) => void;
  onViewEmployeeRecord: (record: ConfirmationRecord) => void;
}

function ProbationTable({
  records,
  onInitiate,
  onManagerApproval,
  onHRReview,
  onAdminApproval,
  onPreview,
  getDaysColor,
  getStatusColor,
  showPostIssueCard,
  onGenerateIDCard,
  onViewEmployeeRecord,
}: ProbationTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Employee Details
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Probation Timeline
            </th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Approval Progress
            </th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {records.map((record) => (
            <React.Fragment key={record.id}>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{record.employeeName}</div>
                    <div className="text-xs text-gray-500">{record.employeeId}</div>
                    <div className="text-xs text-gray-600">{record.designation}</div>
                    <div className="text-xs text-gray-500">{record.department}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <div>
                      <strong>Joined:</strong>{" "}
                      {new Date(record.joiningDate).toLocaleDateString("en-IN")}
                    </div>
                    <div>
                      <strong>End Date:</strong>{" "}
                      {new Date(record.probationEndDate).toLocaleDateString("en-IN")}
                      <span className="text-xs text-gray-500 ml-2">
                        (Probation: {record.probationPeriod})
                      </span>
                    </div>
                    <div className={getDaysColor(record.daysUntilProbationEnd)}>
                      <strong>Days Left:</strong> {record.daysUntilProbationEnd} days
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge className={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1 text-xs">
                    {record.initiatedBy && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>HR Initiated</span>
                      </div>
                    )}
                    {record.managerApprovalBy && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>Manager Approved</span>
                      </div>
                    )}
                    {record.hrReviewBy && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>HR Reviewed</span>
                      </div>
                    )}
                    {record.adminApprovalBy && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>Admin Confirmed</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {record.status === "Confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPreview(record)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Letter
                      </Button>
                    )}
                    {record.status === "Pending Initiation" && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => onInitiate(record)}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Initiate
                      </Button>
                    )}
                    {record.status === "Pending Manager Approval" && (
                      <Button
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700"
                        onClick={() => onManagerApproval(record)}
                      >
                        <UserCheck className="w-3 h-3 mr-1" />
                        Manager Action
                      </Button>
                    )}
                    {record.status === "Pending HR Review" && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => onHRReview(record)}
                      >
                        <FileCheck className="w-3 h-3 mr-1" />
                        HR Review
                      </Button>
                    )}
                    {record.status === "Pending Admin Approval" && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => onAdminApproval(record)}
                      >
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Admin Approve
                      </Button>
                    )}
                  </div>
                </td>
              </tr>

              {/* Post-Issue Action Card */}
              {record.status === "Confirmed" && showPostIssueCard === record.id && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 border-t-2 border-green-400 p-4 animate-slide-down">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-900">
                              {record.employeeName} is now confirmed. Next steps:
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Button
                            size="sm"
                            onClick={() => onGenerateIDCard(record)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Generate ID Card
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewEmployeeRecord(record)}
                          >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            View Employee Record
                          </Button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Confirmation Letter Template
function ConfirmationLetterTemplate({ record }: { record: ConfirmationRecord }) {
  return (
    <div className="bg-white p-8 border border-gray-300">
      {/* Letterhead */}
      <div className="border-b-2 border-blue-600 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-blue-600">CleanCar 360°</h1>
        <p className="text-sm text-gray-600 mt-1">
          Car Washing & Detailing Services
        </p>
        <p className="text-xs text-gray-500">
          Head Office: Ring Road, Surat, Gujarat - 395002 | CIN: U74999GJ2020PTC115959
        </p>
      </div>

      {/* Reference Number & Date */}
      <div className="flex justify-between text-sm text-gray-700 mb-6">
        <div>
          <strong>Ref No:</strong> {record.id}
        </div>
        <div>
          <strong>Date:</strong>{" "}
          {record.confirmationLetterDate
            ? new Date(record.confirmationLetterDate).toLocaleDateString("en-IN")
            : new Date().toLocaleDateString("en-IN")}
        </div>
      </div>

      {/* Employee Address */}
      <div className="mb-6 text-sm">
        <p className="font-semibold">{record.employeeName}</p>
        <p className="text-gray-600">{record.employeeId}</p>
        <p className="text-gray-600">{record.designation}</p>
        <p className="text-gray-600">{record.department}</p>
      </div>

      {/* Subject */}
      <div className="mb-6">
        <p className="font-bold">
          Subject: <span className="font-normal">Confirmation of Employment</span>
        </p>
      </div>

      {/* Body */}
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>Dear {record.employeeName},</p>

        <p>
          We are pleased to inform you that you have successfully completed your probation
          period with CleanCar 360°. Based on your performance during the probation period and
          the recommendation of your reporting manager, we are delighted to confirm your
          employment with us.
        </p>

        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-blue-900">Employment Details:</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Employee ID:</strong> {record.employeeId}
            </div>
            <div>
              <strong>Designation:</strong> {record.designation}
            </div>
            <div>
              <strong>Department:</strong> {record.department}
            </div>
            <div>
              <strong>Reporting Manager:</strong> {record.reportingManager}
            </div>
            <div>
              <strong>Date of Joining:</strong>{" "}
              {new Date(record.joiningDate).toLocaleDateString("en-IN")}
            </div>
            <div>
              <strong>Probation End Date:</strong>{" "}
              {new Date(record.probationEndDate).toLocaleDateString("en-IN")}
              <span className="text-xs text-gray-500 ml-2">
                ({record.probationPeriod})
              </span>
            </div>
            <div className="col-span-2">
              <strong>Confirmation Date:</strong>{" "}
              {record.confirmationLetterDate
                ? new Date(record.confirmationLetterDate).toLocaleDateString("en-IN")
                : new Date().toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">
            Leave Entitlement (Post-Confirmation):
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Casual Leave (CL):</strong> 12 days per year</li>
            <li><strong>Sick Leave (SL):</strong> 6 days per year</li>
            <li><strong>Earned Leave (EL):</strong> 15 days per year (Accrued after 1 year of continuous service)</li>
            <li><strong>National Holidays:</strong> As per company calendar</li>
            <li><strong>Weekly Off:</strong> 1 day per week (rotational basis)</li>
          </ul>
          <p className="text-xs text-green-700 mt-2">
            Note: Leave policy is subject to company's leave policy guidelines and approval from your reporting manager.
          </p>
        </div>

        <p>
          All other terms and conditions of your employment including compensation, benefits,
          working hours, and responsibilities remain unchanged as per your original appointment
          letter dated{" "}
          <strong>{new Date(record.joiningDate).toLocaleDateString("en-IN")}</strong>.
        </p>

        <p>
          We congratulate you on your confirmation and look forward to your continued
          contribution to CleanCar 360°. We wish you all the best in your career with us.
        </p>

        <p>
          Should you have any questions regarding this confirmation, please feel free to
          contact the HR department.
        </p>

        <div className="mt-8">
          <p>Sincerely,</p>
          <div className="mt-8">
            <p className="font-semibold">Neeta Sharma</p>
            <p className="text-sm">HR Manager</p>
            <p className="text-sm">CleanCar 360°</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="font-semibold">Approved By:</p>
          <div className="mt-4">
            <p className="font-semibold">Rajesh Patel</p>
            <p className="text-sm">Super Admin</p>
            <p className="text-sm">CleanCar 360°</p>
          </div>
        </div>
      </div>

      {/* Acknowledgement */}
      <div className="mt-12 pt-8 border-t-2 border-gray-300">
        <h4 className="font-semibold mb-4">EMPLOYEE ACKNOWLEDGEMENT</h4>
        <p className="text-sm mb-4">
          I, {record.employeeName}, acknowledge receipt of this confirmation letter and
          understand the terms mentioned herein.
        </p>
        <div className="grid grid-cols-3 gap-8 mt-8">
          <div>
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm text-gray-600">Employee Name</p>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm text-gray-600">Signature</p>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm text-gray-600">Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
