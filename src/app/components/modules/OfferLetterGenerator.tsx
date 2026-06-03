// Unified Offer Letter System - COMPLETELY REWRITTEN
// Uses GROSS-based salary calculation matching Payroll Configuration
import React, { useState, useEffect } from "react";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import type { EmployeeDatabaseRecord } from "../../services/employeeDatabaseService";
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
  XCircle,
  Edit,
  Mail,
  Download,
  AlertCircle,
  X,
  Settings,
  Plus,
  Search,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { calculateCTCFromGross, getSalaryConfigurationSummary } from "../../config/salaryConfiguration";
import { Link } from "react-router-dom";
import { salaryStructureService } from "../../services/salaryStructureService";
import type { SalaryStructure, SalaryComponents } from "../../services/salaryStructureService";
import { SalaryStructureSelector } from "./SalaryStructureSelector";

type OfferStatus = "Draft" | "Pending Approval" | "Approved" | "Sent" | "Accepted" | "Rejected";

interface OfferLetter {
  id: string;
  employeeTempId: string;
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
  salaryStructureId?: string; // Reference to the salary structure used
  dateOfJoining: string;
  probationPeriod: string;
  workingHours: string;
  leaveEntitlement: string;
  issueDate: string;
  acceptanceDeadline: string;
  status: OfferStatus;
  sentOn?: string;
  acceptedOn?: string;
  rejectedOn?: string;
}

// Sample employees
// ✅ FIXED: mockEmployees — use live data from context
const mockEmployees = [] as any[];
const initialOffers: OfferLetter[] = [
  {
    id: "OFR-2026-001",
    employeeTempId: "EMP-003",
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
    workingHours: getWorkingHoursForRole(newOffer.designation),
    leaveEntitlement: "CL: 7/year, SL: 7/year, PL: 12/year (accrued after 1 year of service)",
    issueDate: "2026-03-15",
    acceptanceDeadline: "2026-03-22",
    status: "Sent",
    sentOn: "2026-03-15",
  },
  {
    id: "OFR-2026-002",
    employeeTempId: "EMP-005",
    candidateName: "Vikram Shah",
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
    workingHours: getWorkingHoursForRole(newOffer.designation),
    leaveEntitlement: "CL: 7/year, SL: 7/year, PL: 12/year (accrued after 1 year of service)",
    issueDate: "2026-03-14",
    acceptanceDeadline: "2026-03-21",
    status: "Draft",
  },
];


// Helper: derive correct working hours from designation
const getWorkingHoursForRole = (designation: string): string => {
  const d = (designation || "").toLowerCase();
  if (d.includes("car washer") || d.includes("washer") || d.includes("supervisor")) {
    return "4:00 AM – 9:00 AM, 6 days/week";
  }
  if (d.includes("tse") || d.includes("sales executive") || d.includes("tele sales")) {
    return "10:00 AM – 7:00 PM, 6 days/week";
  }
  return "10:00 AM – 7:00 PM, 6 days/week";
};

export function OfferLetterGenerator() {
  const [offers, setOffers] = useState<OfferLetter[]>(() => {
    const stored = offerLetterService.getAll();
    // If no offers in storage, use initial offers
    if (stored.length === 0) {
      initialOffers.forEach(offer => offerLetterService.add(offer as any));
      return initialOffers;
    }
    return stored as any[];
  });
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferLetter | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [liveEmployees, setLiveEmployees] = useState<EmployeeDatabaseRecord[]>([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  
  // Salary structure selection states
  const [savedSalaryStructures, setSavedSalaryStructures] = useState<SalaryStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string>("");
  const [availableStructuresForRole, setAvailableStructuresForRole] = useState<SalaryStructure[]>([]);

  // Load all saved salary structures
  useEffect(() => {
    setSavedSalaryStructures(salaryStructureService.getAll());

    const unsubscribe = salaryStructureService.subscribe((structures) => {
      setSavedSalaryStructures(structures);
    });

    return unsubscribe;
  }, []);

  // Load live employees from employee database
  useEffect(() => {
    setLiveEmployees(employeeDatabaseService.getAll());

    const unsubscribe = employeeDatabaseService.subscribe((employees) => {
      setLiveEmployees(employees);
    });

    return unsubscribe;
  }, []);

  // Subscribe to offer letter changes
  useEffect(() => {
    const unsubscribe = offerLetterService.subscribe((updatedOffers) => {
      setOffers(updatedOffers as any[]);
    });

    return unsubscribe;
  }, []);

  // Filter structures when employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      const emp = liveEmployees.find(e => e.id === selectedEmployee || e.tempId === selectedEmployee);
      if (emp) {
        // Show ALL salary structures (user can select any structure for any role)
        setAvailableStructuresForRole(savedSalaryStructures);
      }
    } else {
      setAvailableStructuresForRole([]);
      setSelectedStructureId("");
    }
  }, [selectedEmployee, savedSalaryStructures, liveEmployees]);

  const getStatusColor = (status: OfferStatus) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "Sent":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Accepted":
        return "bg-green-100 text-green-800 border-green-300";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-300";
    }
  };

  const getStatusIcon = (status: OfferStatus) => {
    switch (status) {
      case "Draft":
        return <Edit className="w-4 h-4" />;
      case "Sent":
        return <Mail className="w-4 h-4" />;
      case "Accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
    }
  };

  const handleCreateOffer = () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee!");
      return;
    }

    if (!selectedStructureId) {
      toast.error("Please select a salary structure!");
      return;
    }

    const employee = eligibleEmployees.find(
      (e) => e.id === selectedEmployee || e.tempId === selectedEmployee
    );
    if (!employee) return;

    const selectedStructure = availableStructuresForRole.find(s => s.id === selectedStructureId);
    
    if (!selectedStructure) {
      toast.error("Selected salary structure not found!");
      return;
    }

    const nextOfferNum = offers.length + 1;
    const offerId = `OFR-2026-${String(nextOfferNum + 2).padStart(3, "0")}`;
    const today = new Date().toISOString().split("T")[0];
    const acceptanceDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const newOffer: OfferLetter = {
      id: offerId,
      employeeTempId: employee.id !== "PENDING" ? employee.id : employee.tempId,
      candidateName: employee.fullName,
      email: employee.email,
      address: employee.permanentAddress,
      designation: employee.designation,
      department: employee.department,
      reportingManager: employee.reportingManager,
      workLocation: employee.workLocation,
      pinCodes: employee.pinCodes,
      skillLevel: employee.skillLevel,
      salaryComponents: selectedStructure.components, // Use exact components from salary structure
      salaryStructureId: selectedStructure.id,
      dateOfJoining: employee.dateOfJoining,
      probationPeriod: employee.probationPeriod,
      workingHours: getWorkingHoursForRole(newOffer.designation),
      leaveEntitlement: "CL: 7/year, SL: 7/year, PL: 12/year (accrued after 1 year of service)",
      issueDate: today,
      acceptanceDeadline: acceptanceDeadline,
      status: "Draft",
    };

    offerLetterService.add(newOffer as any);
    setShowCreateModal(false);
    setSelectedEmployee("");
    setSelectedStructureId("");
    setEmployeeSearchTerm("");

    toast.success(`✅ Offer Letter Created!\n\n${offerId} - ${employee.fullName}\nStructure: ${selectedStructure.id} (${selectedStructure.roleName})\nGross: ₹${(newOffer?.salaryComponents?.monthlyGross ?? 0).toLocaleString()} | Net: ₹${(newOffer?.salaryComponents?.netTakeHome ?? 0).toLocaleString()}`);
  };

  const handleSubmitForApproval = (offer: OfferLetter) => {
    offerLetterService.update(offer.id, { status: "Pending Approval" as any });
    toast.success(`📋 Offer letter submitted for HR Manager approval`);
  };

  const handleApproveOffer = (offer: OfferLetter) => {
    offerLetterService.update(offer.id, { status: "Approved" as any });
    toast.success(`✅ Offer letter approved — ready to send`);
  };

  const handleSendOffer = (offer: OfferLetter) => {
    if (offer.status !== "Approved") {
      toast.error("Offer letter must be approved before sending. Submit for approval first.");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    offerLetterService.update(offer.id, { status: "Sent", sentOn: today });
    toast.success(`📧 Offer Letter Sent!\n\n${offer.id} sent to ${offer.candidateName}`);
  };

  const handleAcceptOffer = (offer: OfferLetter) => {
    const today = new Date().toISOString().split("T")[0];
    offerLetterService.update(offer.id, { status: "Accepted", acceptedOn: today });
    toast.success(`✅ Offer Accepted!\n\n${offer.candidateName} accepted ${offer.id}`);
  };

  const handleRejectOffer = (offer: OfferLetter) => {
    const today = new Date().toISOString().split("T")[0];
    offerLetterService.update(offer.id, { status: "Rejected", rejectedOn: today });
    toast.error(`❌ Offer Rejected\n\n${offer.candidateName} rejected ${offer.id}`);
  };

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      offer.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.employeeTempId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || offer.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const draftCount = offers.filter((o) => o.status === "Draft").length;
  const sentCount = offers.filter((o) => o.status === "Sent").length;
  const acceptedCount = offers.filter((o) => o.status === "Accepted").length;
  const rejectedCount = offers.filter((o) => o.status === "Rejected").length;

  const handleEmployeeSelect = (tempId: string) => {
    setSelectedEmployee(tempId);
    setSelectedStructureId(""); // Reset structure selection
  };

  // Filter eligible employees (those without offer letters already)
  const eligibleEmployees = liveEmployees.filter((emp) => {
    // Check if employee already has an offer letter
    const hasOffer = offers.some(
      (offer) => offer.employeeTempId === emp.id || offer.employeeTempId === emp.tempId
    );
    if (hasOffer) return false;

    // Filter by search term if provided
    if (employeeSearchTerm.trim()) {
      const searchLower = employeeSearchTerm.toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(searchLower) ||
        emp.id.toLowerCase().includes(searchLower) ||
        emp.tempId.toLowerCase().includes(searchLower) ||
        emp.designation.toLowerCase().includes(searchLower) ||
        emp.department.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

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
                All salary components (HRA %, PF %, Conveyance, etc.) are configured centrally in the <strong>Payroll Configuration System</strong>.
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

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{acceptedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
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
                placeholder="Search by name, offer ID, or temp ID..."
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
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Offer Letter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Offer Letters ({filteredOffers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Offer Details
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
                {filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{offer.id}</div>
                        <div className="text-xs text-amber-600 font-mono">
                          {offer.employeeTempId}
                        </div>
                        <div className="text-xs text-gray-500">{offer.issueDate}</div>
                        {offer.salaryStructureId && (
                          <div className="text-xs text-blue-600 mt-1">
                            {offer.salaryStructureId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {offer.candidateName}
                        </div>
                        <div className="text-xs text-gray-500">{offer.email}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {offer.skillLevel}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {offer.designation}
                        </div>
                        <div className="text-xs text-gray-500">{offer.department}</div>
                        <div className="text-xs text-gray-500">{offer.workLocation}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="font-semibold text-gray-900">
                        ₹{(offer?.salaryComponents?.monthlyGross ?? 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Gross</div>
                      <div className="text-xs text-green-600 font-medium">
                        ₹{(offer?.salaryComponents?.netTakeHome ?? 0).toLocaleString()} net
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Basic: ₹{(offer?.salaryComponents?.basic ?? 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={getStatusColor(offer.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(offer.status)}
                          {offer.status}
                        </span>
                      </Badge>
                      {offer.sentOn && (
                        <div className="text-xs text-gray-500 mt-1">
                          Sent: {offer.sentOn}
                        </div>
                      )}
                      {offer.acceptedOn && (
                        <div className="text-xs text-green-600 mt-1">
                          Accepted: {offer.acceptedOn}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOffer(offer);
                            setShowPreviewModal(true);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {offer.status === "Draft" && (
                          <Button
                            size="sm"
                            className="bg-yellow-600 hover:bg-yellow-700"
                            onClick={() => handleSubmitForApproval(offer)}
                          >
                            Submit for Approval
                          </Button>
                        )}
                        {(offer.status as string) === "Pending Approval" && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleApproveOffer(offer)}
                          >
                            Approve
                          </Button>
                        )}
                        {(offer.status as string) === "Approved" && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleSendOffer(offer)}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Send
                          </Button>
                        )}
                        {offer.status === "Sent" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptOffer(offer)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectOffer(offer)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <CardTitle>Create Offer Letter</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedEmployee("");
                    setSelectedStructureId("");
                    setEmployeeSearchTerm("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                <div>
                  <Label>Select Employee *</Label>

                  {/* Search field */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name or ID..."
                      className="pl-10"
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Empty state or dropdown */}
                  {eligibleEmployees.length === 0 ? (
                    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                      <CardContent className="p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-gray-700 mb-2">No Eligible Employees Found</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          {liveEmployees.length === 0
                            ? "Add employees in the Employee Database first"
                            : employeeSearchTerm
                            ? "No employees match your search"
                            : "All employees already have offer letters"}
                        </p>
                        {liveEmployees.length === 0 && (
                          <Link to="/hr/employee-ledger">
                            <Button size="sm" variant="outline">
                              <Plus className="w-4 h-4 mr-2" />
                              Go to Employee Database
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Select value={selectedEmployee} onValueChange={handleEmployeeSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleEmployees.map((emp) => (
                          <SelectItem key={emp.tempId || emp.id} value={emp.tempId || emp.id}>
                            {emp.id !== "PENDING" ? emp.id : emp.tempId} | {emp.fullName} | {emp.designation} | {emp.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedEmployee && (() => {
                  const emp = eligibleEmployees.find(
                    (e) => e.id === selectedEmployee || e.tempId === selectedEmployee
                  );
                  if (!emp) return null;

                  return (
                    <>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Employee Details (Auto-Filled)
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Name:</span>{" "}
                            <span className="ml-2 font-medium">{emp.fullName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Employee ID:</span>{" "}
                            <span className="ml-2 font-mono text-amber-700">
                              {emp.id !== "PENDING" ? emp.id : emp.tempId}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Email:</span>{" "}
                            <span className="ml-2">{emp.email}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Designation:</span>{" "}
                            <span className="ml-2">{emp.designation}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Department:</span>{" "}
                            <span className="ml-2">{emp.department}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Skill Level:</span>{" "}
                            <span className="ml-2">{emp.skillLevel}</span>
                          </div>
                        </div>
                      </div>

                      {/* Salary Structure Selection Component */}
                      <SalaryStructureSelector
                        availableStructures={availableStructuresForRole}
                        selectedStructureId={selectedStructureId}
                        onStructureSelect={(id) => {
                          setSelectedStructureId(id);
                          if (id) {
                            const structure = availableStructuresForRole.find(s => s.id === id);
                            if (structure) {
                              toast.success(`✅ Applied salary structure: ${structure.id}\n\nGross: ₹${(structure?.monthlyGross ?? 0).toLocaleString()} | Net: ₹${(structure?.components?.netTakeHome ?? 0).toLocaleString()}`);
                            }
                          }
                        }}
                        customBasicSalary={0}
                        onBasicSalaryChange={() => {}}
                        employeeDesignation={emp.designation}
                      />
                    </>
                  );
                })()}

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleCreateOffer}
                    disabled={!selectedEmployee || !selectedStructureId}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Create Offer Letter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl my-8">
            <CardHeader className="border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <CardTitle>Offer Letter Preview - {selectedOffer.id}</CardTitle>
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
                <div className="border-b-2 border-blue-600 pb-4 mb-6">
                  <h1 className="text-3xl font-bold text-blue-600">CleanCar 360°</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Car Washing & Detailing Services
                  </p>
                  <p className="text-xs text-gray-500">
                    Head Office: Ring Road, Surat, Gujarat - 395002 | CIN:
                    U74999GJ2020PTC115959
                  </p>
                </div>

                {/* Date */}
                <div className="text-right text-sm text-gray-700 mb-6">
                  <strong>Date:</strong>{" "}
                  {new Date(selectedOffer.issueDate).toLocaleDateString("en-IN")}
                </div>

                {/* Candidate Address */}
                <div className="mb-6 text-sm">
                  <p className="font-semibold">{selectedOffer.candidateName}</p>
                  <p className="text-gray-600">{selectedOffer.address}</p>
                </div>

                {/* Subject */}
                <div className="mb-6">
                  <p className="font-bold">
                    Subject: <span className="font-normal">Offer of Employment</span>
                  </p>
                </div>

                {/* Body */}
                <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                  <p>Dear {selectedOffer.candidateName},</p>

                  <p>
                    We are pleased to offer you the position of{" "}
                    <strong>{selectedOffer.designation}</strong> with CleanCar 360°. We
                    believe your skills and experience will be a valuable addition to our
                    team.
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-gray-900">Position Details:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <strong>Position:</strong> {selectedOffer.designation}
                      </div>
                      <div>
                        <strong>Department:</strong> {selectedOffer.department}
                      </div>
                      <div>
                        <strong>Reporting Manager:</strong>{" "}
                        {selectedOffer.reportingManager}
                      </div>
                      <div>
                        <strong>Work Location:</strong> {selectedOffer.workLocation}
                      </div>
                      <div>
                        <strong>Date of Joining:</strong>{" "}
                        {new Date(selectedOffer.dateOfJoining).toLocaleDateString(
                          "en-IN"
                        )}
                      </div>
                      <div>
                        <strong>Probation Period:</strong> {selectedOffer.probationPeriod}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      Compensation Details (Monthly):
                    </h4>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b">
                          <td className="py-1">Basic Salary</td>
                          <td className="text-right py-1">
                            ₹{(selectedOffer?.salaryComponents?.basic ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1">House Rent Allowance (HRA)</td>
                          <td className="text-right py-1">
                            ₹{(selectedOffer?.salaryComponents?.hra ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-1">Conveyance Allowance</td>
                          <td className="text-right py-1">
                            ₹{(selectedOffer?.salaryComponents?.conveyance ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        {selectedOffer.salaryComponents.medical > 0 && (
                          <tr className="border-b">
                            <td className="py-1">Medical Allowance</td>
                            <td className="text-right py-1">
                              ₹{(selectedOffer?.salaryComponents?.medical ?? 0).toLocaleString()}
                            </td>
                          </tr>
                        )}
                        {selectedOffer.salaryComponents.specialAllowance > 0 && (
                          <tr className="border-b">
                            <td className="py-1">Special Allowance</td>
                            <td className="text-right py-1">
                              ₹{(selectedOffer?.salaryComponents?.specialAllowance ?? 0).toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="border-b border-t-2 border-gray-400 font-semibold">
                          <td className="py-1">Gross Salary</td>
                          <td className="text-right py-1">
                            ₹{(selectedOffer?.salaryComponents?.monthlyGross ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-b text-red-600">
                          <td className="py-1">Provident Fund (PF) - 12%</td>
                          <td className="text-right py-1">
                            -₹{(selectedOffer?.salaryComponents?.employeePF ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        {selectedOffer.salaryComponents.employeeESIC > 0 && (
                          <tr className="border-b text-red-600">
                            <td className="py-1">ESIC - 0.75%</td>
                            <td className="text-right py-1">
                              -₹{(selectedOffer?.salaryComponents?.employeeESIC ?? 0).toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="border-b text-red-600">
                          <td className="py-1">Professional Tax</td>
                          <td className="text-right py-1">
                            -₹{(selectedOffer?.salaryComponents?.professionalTax ?? 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr className="border-t-2 border-gray-400 font-bold text-green-700">
                          <td className="py-2">Net Take Home</td>
                          <td className="text-right py-2">
                            ₹{(selectedOffer?.salaryComponents?.netTakeHome ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <p>
                      <strong>Working Hours:</strong> {selectedOffer.workingHours}
                    </p>
                    <p>
                      <strong>Leave Entitlement:</strong>{" "}
                      {selectedOffer.leaveEntitlement}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                    <h4 className="font-semibold text-yellow-900 mb-2">
                      ⚠️ Leave Policy During Probation Period:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                      <li><strong>Casual Leave (CL):</strong> Up to 6 days (pro-rata basis during probation)</li>
                      <li><strong>Sick Leave (SL):</strong> Up to 3 days (with medical certificate)</li>
                      <li><strong>Earned Leave (EL):</strong> Not applicable during probation period</li>
                      <li><strong>National Holidays:</strong> As per company calendar</li>
                      <li><strong>Weekly Off:</strong> 1 day per week (rotational basis)</li>
                    </ul>
                    <p className="text-xs text-yellow-700 mt-2 font-semibold">
                      Note: Full leave entitlement (as mentioned above) will be applicable ONLY after successful completion of probation period and issuance of confirmation letter.
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                    <h4 className="font-semibold text-green-900 mb-2">
                      ✅ Leave Policy After Confirmation:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                      <li><strong>Casual Leave (CL):</strong> 12 days per year</li>
                      <li><strong>Sick Leave (SL):</strong> 6 days per year</li>
                      <li><strong>Earned Leave (EL):</strong> 15 days per year (Accrued after 1 year of continuous service)</li>
                      <li><strong>National Holidays:</strong> As per company calendar</li>
                      <li><strong>Weekly Off:</strong> 1 day per week (rotational basis)</li>
                    </ul>
                    <p className="text-xs text-green-700 mt-2">
                      This enhanced leave policy will be applicable after your confirmation, which will be evaluated upon successful completion of your probation period ({selectedOffer.probationPeriod}).
                    </p>
                  </div>

                  <p>
                    This offer is valid until{" "}
                    <strong>
                      {new Date(selectedOffer.acceptanceDeadline).toLocaleDateString(
                        "en-IN"
                      )}
                    </strong>
                    . Please confirm your acceptance by signing and returning this
                    letter.
                  </p>

                  <p>We look forward to welcoming you to the CleanCar 360° team!</p>

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
                  <h4 className="font-semibold mb-4">CANDIDATE ACKNOWLEDGEMENT</h4>
                  <p className="text-sm mb-4">
                    I, {selectedOffer.candidateName}, hereby accept the above offer of
                    employment:
                  </p>
                  <div className="grid grid-cols-3 gap-8 mt-8">
                    <div>
                      <div className="border-t border-gray-400 pt-2">
                        <p className="text-sm text-gray-600">Name</p>
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
