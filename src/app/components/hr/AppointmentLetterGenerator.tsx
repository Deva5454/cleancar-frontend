// Appointment Letter Generator - COMPLETELY REWRITTEN
// Uses GROSS-based salary calculation matching Payroll Configuration
import React, { useState, useEffect } from "react";
import { offerLetterService } from "../../services/offerLetterService";
import type { OfferLetterRecord } from "../../services/offerLetterService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  FileText,
  Send,
  Eye,
  CheckCircle,
  AlertCircle,
  Edit,
  Clock,
  Download,
  Plus,
  X,
  Printer,
  Search,
  Settings,
  ArrowRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { calculateCTCFromGross, getSalaryConfigurationSummary } from "../../config/salaryConfiguration";
import { Link, useNavigate } from "react-router-dom";
import { salaryStructureService } from "../../services/salaryStructureService";
import type { SalaryStructure, SalaryComponents } from "../../services/salaryStructureService";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";

type AppointmentStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Sent";

interface AppointmentLetter {
  id: string;
  offerId?: string; // Link to offer letter
  employeeTempId: string;
  employeePermanentId?: string;
  candidateName: string;
  email: string;
  address: string;
  designation: string;
  department: string;
  reportingManager: string;
  workLocation: string;
  pinCodes: string[];
  skillLevel: string;
  salaryComponents: SalaryComponents;
  salaryStructureId?: string;
  dateOfJoining: string;
  probationPeriod: string;
  workingHours: string;
  leaveEntitlement: string;
  issueDate: string;
  status: AppointmentStatus;
  createdBy: string;
  approvedBy?: string;
  approvedOn?: string;
  sentOn?: string;
  notes?: string;
}

// Sample accepted offers that can be converted to appointments (using GROSS-based calculation)
const acceptedOffers = [
  {
    offerId: "OFR-2026-001",
    tempId: "TEMP-003",
    name: "Kiran Desai",
    email: "kiran.desai@cleancar.com",
    address: "789, Ring Road, Surat, Gujarat - 395009",
    designation: "Car Washer",
    department: "Operations",
    reportingManager: "Prakash Rao (Supervisor)",
    workLocation: "Surat - Zone C",
    pinCodes: ["395009"],
    skillLevel: "Skilled",
    salaryComponents: calculateCTCFromGross(13600), // Using GROSS = 13,600
    dateOfJoining: "2026-03-15",
    probationPeriod: "3 months",
  },
  {
    offerId: "OFR-2026-002",
    tempId: "TEMP-005",
    name: "Vikram Shah",
    email: "vikram.shah@cleancar.com",
    address: "654, Vesu, Surat, Gujarat - 395001",
    designation: "Supervisor",
    department: "Operations",
    reportingManager: "Amit Patel (Operations Manager)",
    workLocation: "Surat - Zone A",
    pinCodes: ["395001", "395002", "395009"],
    skillLevel: "Skilled",
    salaryComponents: calculateCTCFromGross(20000), // Using GROSS = 20,000
    dateOfJoining: "2026-03-14",
    probationPeriod: "3 months",
  },
  {
    offerId: "OFR-2026-003",
    tempId: "TEMP-006",
    name: "Anjali Mehta",
    email: "anjali.mehta@cleancar.com",
    address: "987, Adajan, Surat, Gujarat - 395010",
    designation: "Tele Sales Executive",
    department: "Sales & CRM",
    reportingManager: "Vikram Kumar (TSM)",
    workLocation: "Surat - Head Office",
    pinCodes: ["395010"],
    skillLevel: "Skilled",
    salaryComponents: calculateCTCFromGross(18000), // Using GROSS = 18,000
    dateOfJoining: "2026-03-12",
    probationPeriod: "3 months",
  },
];

// Sample existing appointments (using GROSS-based calculation)
const initialAppointments: AppointmentLetter[] = [
  {
    id: "APT-2026-001",
    offerId: "OFR-2026-001",
    employeeTempId: "TEMP-003",
    candidateName: "Kiran Desai",
    email: "kiran.desai@cleancar.com",
    address: "789, Ring Road, Surat, Gujarat - 395009",
    designation: "Car Washer",
    department: "Operations",
    reportingManager: "Prakash Rao (Supervisor)",
    workLocation: "Surat - Zone C",
    pinCodes: ["395009"],
    skillLevel: "Skilled",
    salaryComponents: calculateCTCFromGross(13600), // Using GROSS = 13,600
    dateOfJoining: "2026-03-15",
    probationPeriod: "3 months",
    workingHours: "9:00 AM – 6:00 PM, 6 days/week",
    leaveEntitlement: "CL: 12/year, SL: 6/year, EL: 15/year (after 1 year)",
    issueDate: "2026-03-16",
    status: "Approved",
    createdBy: "Neeta Sharma (HR Manager)",
    approvedBy: "Rajesh Patel (Super Admin)",
    approvedOn: "2026-03-17",
  },
];

export function AppointmentLetterGenerator() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentLetter[]>(initialAppointments);
  const [selectedOffer, setSelectedOffer] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentLetter | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [liveAcceptedOffers, setLiveAcceptedOffers] = useState<OfferLetterRecord[]>([]);
  const [offerSearchTerm, setOfferSearchTerm] = useState("");
  const [showPostSendCard, setShowPostSendCard] = useState<string | null>(null);

  // Load accepted offers from service
  useEffect(() => {
    setLiveAcceptedOffers(offerLetterService.getAccepted());

    const unsubscribe = offerLetterService.subscribe((offers) => {
      setLiveAcceptedOffers(offers.filter(o => o.status === "Accepted"));
    });

    return unsubscribe;
  }, []);

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "Pending Approval":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "Sent":
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case "Draft":
        return <Edit className="w-4 h-4" />;
      case "Pending Approval":
        return <Clock className="w-4 h-4" />;
      case "Approved":
        return <CheckCircle className="w-4 h-4" />;
      case "Rejected":
        return <AlertCircle className="w-4 h-4" />;
      case "Sent":
        return <Send className="w-4 h-4" />;
    }
  };

  // Filter eligible offers (accepted and not yet converted)
  const eligibleOffers = liveAcceptedOffers.filter((offer) => {
    // Filter by search term if provided
    if (offerSearchTerm.trim()) {
      const searchLower = offerSearchTerm.toLowerCase();
      return (
        offer.candidateName.toLowerCase().includes(searchLower) ||
        offer.id.toLowerCase().includes(searchLower) ||
        offer.designation.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleCreateAppointment = () => {
    if (!selectedOffer) {
      toast.error("Please select an accepted offer!");
      return;
    }

    const offer = liveAcceptedOffers.find((o) => o.id === selectedOffer);
    if (!offer) return;

    const nextNum = appointments.length + 1;
    const appointmentId = `APT-2026-${String(nextNum + 1).padStart(3, "0")}`;
    const today = new Date().toISOString().split("T")[0];

    const newAppointment: AppointmentLetter = {
      id: appointmentId,
      offerId: offer.id,
      employeeTempId: offer.employeeTempId,
      candidateName: offer.candidateName,
      email: offer.email,
      address: offer.address,
      designation: offer.designation,
      department: offer.department,
      reportingManager: offer.reportingManager,
      workLocation: offer.workLocation,
      pinCodes: offer.pinCodes,
      skillLevel: offer.skillLevel,
      salaryComponents: offer.salaryComponents,
      dateOfJoining: offer.dateOfJoining,
      probationPeriod: offer.probationPeriod,
      workingHours: "9:00 AM – 6:00 PM, 6 days/week",
      leaveEntitlement: "CL: 12/year, SL: 6/year, EL: 15/year (after 1 year)",
      issueDate: today,
      status: "Draft",
      createdBy: "Neeta Sharma (HR Manager)",
    };

    // Mark offer as converted
    offerLetterService.markAsConverted(offer.id, appointmentId);

    setAppointments([...appointments, newAppointment]);
    setShowCreateModal(false);
    setSelectedOffer("");
    setOfferSearchTerm("");

    toast.success(
      `✅ Appointment Letter Created!\n\n${appointmentId} - ${offer.candidateName}\nFrom Offer: ${offer.id}\nGross: ₹${(offer?.salaryComponents?.monthlyGross ?? 0).toLocaleString()} | Net: ₹${(offer?.salaryComponents?.netTakeHome ?? 0).toLocaleString()}`
    );
  };

  const handleSubmitForApproval = (appointment: AppointmentLetter) => {
    const updated = appointments.map((a) =>
      a.id === appointment.id ? { ...a, status: "Pending Approval" as AppointmentStatus } : a
    );
    setAppointments(updated);
    toast.info(
      `📋 Submitted for Approval\n\n${appointment.id} - ${appointment.candidateName}\nAwaiting Super Admin approval`
    );
  };

  const handleApprove = (appointment: AppointmentLetter) => {
    const today = new Date().toISOString().split("T")[0];
    const updated = appointments.map((a) =>
      a.id === appointment.id
        ? {
            ...a,
            status: "Approved" as AppointmentStatus,
            approvedBy: "Rajesh Patel (Super Admin)",
            approvedOn: today,
          }
        : a
    );
    setAppointments(updated);
    toast.success(
      `✅ Appointment Approved!\n\n${appointment.candidateName}\n${appointment.id}\n\nReady to send to employee`
    );
  };

  const handleReject = (appointment: AppointmentLetter) => {
    const updated = appointments.map((a) =>
      a.id === appointment.id ? { ...a, status: "Rejected" as AppointmentStatus } : a
    );
    setAppointments(updated);
    toast.error(
      `❌ Appointment Rejected\n\n${appointment.candidateName}\n${appointment.id}\n\nReason can be specified`
    );
  };

  const handleSend = (appointment: AppointmentLetter) => {
    const today = new Date().toISOString().split("T")[0];
    const updated = appointments.map((a) =>
      a.id === appointment.id ? { ...a, status: "Sent" as AppointmentStatus, sentOn: today } : a
    );
    setAppointments(updated);

    // Update employee's Journey Tracker to Stage 5: Appointment Letter Issued
    const allEmployees = employeeDatabaseService.getAll();
    const employee = allEmployees.find(
      (emp) => emp.id === appointment.employeeTempId || emp.tempId === appointment.employeeTempId
    );
    if (employee) {
      employeeDatabaseService.update(employee.id, {
        journeyStage: 5,
        journeyStageName: "Appointment Letter Issued",
      });
    }

    // Show post-send action card
    setShowPostSendCard(appointment.id);

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      setShowPostSendCard(null);
    }, 15000);

    toast.success(
      `📧 Appointment Letter Sent!\n\n${appointment.id} sent to ${appointment.candidateName}`
    );
  };

  const handleSendOnboardingLink = (appointment: AppointmentLetter) => {
    // Pre-select employee and link type in session storage
    sessionStorage.setItem("onboarding_preselect_employee", appointment.employeeTempId);
    sessionStorage.setItem("onboarding_preselect_linktype", "Full Onboarding");

    // Navigate to Onboarding Automation screen
    navigate("/hr/onboarding-automation");

    // Dismiss the card
    setShowPostSendCard(null);
  };

  const handleDoLater = () => {
    setShowPostSendCard(null);
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.employeeTempId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const draftCount = appointments.filter((a) => a.status === "Draft").length;
  const pendingCount = appointments.filter((a) => a.status === "Pending Approval").length;
  const approvedCount = appointments.filter((a) => a.status === "Approved").length;
  const sentCount = appointments.filter((a) => a.status === "Sent").length;

  return (
    <div className="space-y-6">
      {/* Salary Configuration Warning Banner */}
      <Card className="border-2 border-orange-300 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 mb-1 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Salary Structure is Controlled from Payroll Configuration
              </h4>
              <p className="text-sm text-orange-800 mb-2">
                All salary components are configured centrally in the <strong>Payroll Configuration System</strong>.
                The CTC breakdown shown here is <strong>read-only</strong> and automatically calculated based on those settings.
              </p>
              <div className="flex items-center gap-2">
                <Link to="/payroll/configuration">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Go to Payroll Configuration
                  </Button>
                </Link>
                <span className="text-xs text-orange-700">
                  {getSalaryConfigurationSummary()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Edit className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Draft</p>
                <p className="text-2xl font-bold">{draftCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Send className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Sent</p>
                <p className="text-2xl font-bold text-blue-600">{sentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header & Actions */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, appointment ID, or temp ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Appointment Letter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Letters ({filteredAppointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Appointment Details
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Candidate
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Position
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Salary (Monthly)
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <React.Fragment key={appointment.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{appointment.id}</div>
                          {appointment.offerId && (
                            <div className="text-xs text-blue-600">
                              From: {appointment.offerId}
                            </div>
                          )}
                          <div className="text-xs text-amber-600 font-mono">
                            {appointment.employeeTempId}
                          </div>
                          <div className="text-xs text-gray-500">{appointment.issueDate}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {appointment.candidateName}
                          </div>
                          <div className="text-xs text-gray-500">{appointment.email}</div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {appointment.skillLevel}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.designation}
                          </div>
                          <div className="text-xs text-gray-500">{appointment.department}</div>
                          <div className="text-xs text-gray-500">{appointment.workLocation}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-900">
                          ₹{(appointment?.salaryComponents?.monthlyGross ?? 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Gross</div>
                        <div className="text-xs text-green-600 font-medium">
                          ₹{(appointment?.salaryComponents?.netTakeHome ?? 0).toLocaleString()} net
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Basic: ₹{(appointment?.salaryComponents?.basic ?? 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={getStatusColor(appointment.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(appointment.status)}
                            {appointment.status}
                          </span>
                        </Badge>
                        {appointment.approvedOn && (
                          <div className="text-xs text-green-600 mt-1">
                            Approved: {appointment.approvedOn}
                          </div>
                        )}
                        {appointment.sentOn && (
                          <div className="text-xs text-blue-600 mt-1">
                            Sent: {appointment.sentOn}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowPreviewModal(true);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {appointment.status === "Draft" && (
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleSubmitForApproval(appointment)}
                            >
                              Submit
                            </Button>
                          )}
                          {appointment.status === "Pending Approval" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(appointment)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(appointment)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {appointment.status === "Approved" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleSend(appointment)}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Send
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Post-Send Action Card */}
                    {showPostSendCard === appointment.id && appointment.status === "Sent" && (
                      <tr>
                        <td colSpan={6} className="px-4 py-0">
                          <div className="animate-slide-down">
                            <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-blue-50 mb-3 shadow-md">
                              <CardContent className="p-4">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                      <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                      Appointment letter sent to {appointment.candidateName}.
                                    </p>
                                    <p className="text-sm text-gray-700 mt-1">
                                      Next step: Send onboarding link
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => handleSendOnboardingLink(appointment)}
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Send Onboarding Link
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleDoLater}
                                    >
                                      Do Later
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-teal-50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <CardTitle>Create Appointment Letter</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedOffer("");
                    setOfferSearchTerm("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-1">
                    📋 Select from Accepted Offers
                  </h4>
                  <p className="text-sm text-blue-700">
                    Only candidates who have accepted their offer letters are shown here.
                  </p>
                </div>

                <div>
                  <Label>Select Accepted Offer *</Label>

                  {/* Search field */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, offer ID, or designation..."
                      className="pl-10"
                      value={offerSearchTerm}
                      onChange={(e) => setOfferSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Empty state or dropdown */}
                  {liveAcceptedOffers.length === 0 ? (
                    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                      <CardContent className="p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-gray-700 mb-2">No Accepted Offers Available</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Go to the Offer Letter tab to send and accept offers first
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowCreateModal(false);
                            setSelectedOffer("");
                            setOfferSearchTerm("");
                            // Switch to offer letter tab
                            const tabTrigger = document.querySelector('[value="offer"]') as HTMLElement;
                            if (tabTrigger) tabTrigger.click();
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Go to Offer Letter Tab
                        </Button>
                      </CardContent>
                    </Card>
                  ) : eligibleOffers.length === 0 && offerSearchTerm ? (
                    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-600">No offers match your search</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Select value={selectedOffer} onValueChange={setSelectedOffer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an accepted offer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleOffers.map((offer) => (
                          <SelectItem
                            key={offer.id}
                            value={offer.id}
                            disabled={offer.convertedToAppointment}
                            className={offer.convertedToAppointment ? "opacity-50" : ""}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {offer.id} | {offer.candidateName} | {offer.designation} | ₹{(offer?.salaryComponents?.monthlyGross ?? 0).toLocaleString()}
                              </span>
                              {offer.convertedToAppointment && (
                                <Badge className="ml-2 bg-gray-400 text-white text-xs">Converted</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedOffer && (() => {
                  const offer = liveAcceptedOffers.find((o) => o.id === selectedOffer);
                  if (!offer) return null;

                  return (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">
                        Candidate Details (From Offer Letter)
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Name:</span>{" "}
                          <span className="ml-2 font-medium">{offer.candidateName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Offer ID:</span>{" "}
                          <span className="ml-2 font-mono text-blue-700">{offer.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>{" "}
                          <span className="ml-2">{offer.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Designation:</span>{" "}
                          <span className="ml-2">{offer.designation}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Department:</span>{" "}
                          <span className="ml-2">{offer.department}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Joining Date:</span>{" "}
                          <span className="ml-2">{offer.dateOfJoining}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Gross Salary:</span>{" "}
                          <span className="ml-2 font-semibold text-green-700">
                            ₹{(offer?.salaryComponents?.monthlyGross ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Net Take Home:</span>{" "}
                          <span className="ml-2 font-semibold text-green-700">
                            ₹{(offer?.salaryComponents?.netTakeHome ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleCreateAppointment}
                    disabled={!selectedOffer}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Create Appointment Letter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl my-8">
            <CardHeader className="border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <CardTitle>Appointment Letter Preview - {selectedAppointment.id}</CardTitle>
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
              <div className="bg-white p-8 border border-gray-300">
                {/* Letterhead */}
                <div className="border-b-2 border-green-600 pb-4 mb-6">
                  <h1 className="text-3xl font-bold text-green-600">CleanCar 360°</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Car Washing & Detailing Services
                  </p>
                  <p className="text-xs text-gray-500">
                    Head Office: Ring Road, Surat, Gujarat - 395002 | CIN:
                    U74999GJ2020PTC115959
                  </p>
                </div>

                {/* Date & Reference */}
                <div className="mb-6 text-sm">
                  <div className="flex justify-between">
                    <div>
                      <strong>Ref:</strong> {selectedAppointment.id}
                    </div>
                    <div>
                      <strong>Date:</strong>{" "}
                      {new Date(selectedAppointment.issueDate).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Candidate Address */}
                <div className="mb-6 text-sm">
                  <p className="font-semibold">{selectedAppointment.candidateName}</p>
                  <p className="text-gray-600">{selectedAppointment.address}</p>
                </div>

                {/* Subject */}
                <div className="mb-6">
                  <p className="font-bold">
                    Subject:{" "}
                    <span className="font-normal">Letter of Appointment</span>
                  </p>
                </div>

                {/* Body */}
                <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                  <p>Dear {selectedAppointment.candidateName},</p>

                  <p>
                    Further to your acceptance of our offer letter (Ref:{" "}
                    {selectedAppointment.offerId || "N/A"}), we are pleased to formally
                    appoint you as <strong>{selectedAppointment.designation}</strong> at
                    CleanCar 360°.
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-gray-900">Employment Details:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <strong>Position:</strong> {selectedAppointment.designation}
                      </div>
                      <div>
                        <strong>Department:</strong> {selectedAppointment.department}
                      </div>
                      <div>
                        <strong>Reporting Manager:</strong>{" "}
                        {selectedAppointment.reportingManager}
                      </div>
                      <div>
                        <strong>Work Location:</strong> {selectedAppointment.workLocation}
                      </div>
                      <div>
                        <strong>Date of Joining:</strong>{" "}
                        {new Date(selectedAppointment.dateOfJoining).toLocaleDateString(
                          "en-IN"
                        )}
                      </div>
                      <div>
                        <strong>Probation Period:</strong> {selectedAppointment.probationPeriod}
                      </div>
                      <div>
                        <strong>Employee ID:</strong> {selectedAppointment.employeeTempId}{" "}
                        <span className="text-xs text-gray-500">(Temporary)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                    <h4 className="font-semibold text-green-900 mb-3">
                      💰 Compensation Structure (Monthly):
                    </h4>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b">
                          <td className="py-1 font-semibold">Earnings</td>
                          <td className="text-right py-1"></td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Basic Salary</td>
                          <td className="text-right py-1">
                            ₹{(selectedAppointment?.salaryComponents?.basic ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">House Rent Allowance (HRA)</td>
                          <td className="text-right py-1">
                            ₹{(selectedAppointment?.salaryComponents?.hra ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 pl-4">Conveyance Allowance</td>
                          <td className="text-right py-1">
                            ₹{(selectedAppointment?.salaryComponents?.conveyance ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        {selectedAppointment.salaryComponents.medical > 0 && (
                          <tr className="border-b">
                            <td className="py-1 pl-4">Medical Allowance</td>
                            <td className="text-right py-1">
                              ₹{(selectedAppointment?.salaryComponents?.medical ?? 0).toLocaleString()}
                            </td>
                          </tr>
                        )}
                        {selectedAppointment.salaryComponents.specialAllowance > 0 && (
                          <tr className="border-b">
                            <td className="py-1 pl-4">Special Allowance</td>
                            <td className="text-right py-1">
                              ₹{(selectedAppointment?.salaryComponents?.specialAllowance ?? 0).toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="border-b border-t-2 border-gray-400 font-semibold bg-green-100">
                          <td className="py-1">Gross Salary</td>
                          <td className="text-right py-1">
                            ₹{(selectedAppointment?.salaryComponents?.monthlyGross ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1 font-semibold text-red-700">Deductions</td>
                          <td className="text-right py-1"></td>
                        </tr>
                        <tr className="border-b text-red-600">
                          <td className="py-1 pl-4">Provident Fund (PF) - 12%</td>
                          <td className="text-right py-1">
                            -₹{(selectedAppointment?.salaryComponents?.employeePF ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        {selectedAppointment.salaryComponents.employeeESIC > 0 && (
                          <tr className="border-b text-red-600">
                            <td className="py-1 pl-4">ESIC - 0.75%</td>
                            <td className="text-right py-1">
                              -₹{(selectedAppointment?.salaryComponents?.employeeESIC ?? 0).toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="border-b text-red-600">
                          <td className="py-1 pl-4">Professional Tax</td>
                          <td className="text-right py-1">
                            -₹{(selectedAppointment?.salaryComponents?.professionalTax ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-t-2 border-gray-400 font-bold text-green-700 bg-green-100">
                          <td className="py-2">Net Take Home Salary</td>
                          <td className="text-right py-2">
                            ₹{(selectedAppointment?.salaryComponents?.netTakeHome ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <div className="flex justify-between text-xs text-green-800">
                        <span>Annual CTC (Cost to Company):</span>
                        <span className="font-bold">
                          ₹{(selectedAppointment?.salaryComponents?.annualCTC ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        <strong>Working Hours:</strong> {selectedAppointment.workingHours}
                      </li>
                      <li>
                        <strong>Probation Period:</strong> {selectedAppointment.probationPeriod} from date of joining
                      </li>
                      <li>
                        <strong>Leave Policy:</strong> As per company policy (detailed in employee handbook)
                      </li>
                      <li>
                        <strong>Notice Period:</strong> 30 days during probation, 60 days post confirmation
                      </li>
                      <li>
                        Your employment is subject to verification of documents and successful completion of background checks
                      </li>
                      <li>
                        You will be bound by the company's code of conduct, policies, and confidentiality agreements
                      </li>
                    </ul>
                  </div>

                  <p>
                    Please sign and return a copy of this letter as confirmation of your
                    acceptance of these terms and conditions.
                  </p>

                  <p>We wish you a successful career with CleanCar 360°!</p>

                  <div className="mt-8">
                    <p>Sincerely,</p>
                    <div className="mt-8">
                      <p className="font-semibold">Neeta Sharma</p>
                      <p className="text-sm">HR Manager</p>
                      <p className="text-sm">CleanCar 360°</p>
                    </div>
                  </div>
                </div>

                {/* Acceptance Section */}
                <div className="mt-12 pt-8 border-t-2 border-gray-300">
                  <h4 className="font-semibold mb-4">EMPLOYEE ACKNOWLEDGEMENT</h4>
                  <p className="text-sm mb-4">
                    I, {selectedAppointment.candidateName}, hereby accept the terms and
                    conditions of this appointment letter:
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
