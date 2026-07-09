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
import { Textarea } from "../ui/textarea";
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
import { calculateCTCFromGross, getSalaryConfigurationSummary } from "../../config/salaryComponentConfiguration";
import { Link } from "react-router-dom";
import { salaryStructureService } from "../../services/salaryStructureService";
import type { SalaryStructure, SalaryComponents } from "../../services/salaryStructureService";
import { SalaryStructureSelector } from "./SalaryStructureSelector";
import { useRole } from "../../contexts/RoleContext";
import { buildOfferLetterDefaults } from "../../config/offerLetterPolicyConfig";

type OfferStatus = "Draft" | "Sent" | "Accepted" | "Rejected";
type OfferLetter = OfferLetterRecord;

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
    workingHours: "9:00 AM – 6:00 PM, 6 days/week",
    leaveEntitlement: "CL: 12/year, SL: 6/year, EL: 15/year (after 1 year)",
    issueDate: "2026-03-15",
    acceptanceDeadline: "2026-03-22",
    status: "Sent",
    sentOn: "2026-03-15",
    ...buildOfferLetterDefaults("Car Washer", "Operations", "Surat"),
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
    workingHours: "9:00 AM – 6:00 PM, 6 days/week",
    leaveEntitlement: "CL: 12/year, SL: 6/year, EL: 15/year (after 1 year)",
    issueDate: "2026-03-14",
    acceptanceDeadline: "2026-03-21",
    status: "Draft",
    ...buildOfferLetterDefaults("Supervisor", "Operations", "Surat"),
  },
];

export function OfferLetterGenerator() {
  const { currentUser, currentRole } = useRole();
  const canEditContent = currentRole === "HR" || currentRole === "Super Admin";
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
  const [showEditContentModal, setShowEditContentModal] = useState(false);
  const [showInternalBreakdown, setShowInternalBreakdown] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<OfferLetter> | null>(null);
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
      mobile: employee.mobile,
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
      workingHours: "9:00 AM – 6:00 PM, 6 days/week",
      leaveEntitlement: "CL: 12/year, SL: 6/year, EL: 15/year (after 1 year)",
      issueDate: today,
      acceptanceDeadline: acceptanceDeadline,
      status: "Draft",
      ...buildOfferLetterDefaults(employee.designation, employee.department, employee.workLocation || "Surat"),
    };

    offerLetterService.add(newOffer as any);
    setShowCreateModal(false);
    setSelectedEmployee("");
    setSelectedStructureId("");
    setEmployeeSearchTerm("");

    toast.success(`✅ Offer Letter Created!\n\n${offerId} - ${employee.fullName}\nStructure: ${selectedStructure.id} (${selectedStructure.roleName})\nGross: ₹${(newOffer?.salaryComponents?.monthlyGross ?? 0).toLocaleString()} | Net: ₹${(newOffer?.salaryComponents?.netTakeHome ?? 0).toLocaleString()}`);
  };

  const handleOpenEditContent = (offer: OfferLetter) => {
    if (!canEditContent) { toast.error("Only HR or Super Admin can edit offer letter content"); return; }
    setSelectedOffer(offer);
    setEditDraft({
      employmentType: offer.employmentType,
      probationMonths: offer.probationMonths,
      noticeDuringProbationMonths: offer.noticeDuringProbationMonths,
      noticeAfterConfirmationMonths: offer.noticeAfterConfirmationMonths,
      acceptanceDeadlineDays: offer.acceptanceDeadlineDays,
      introText: offer.introText,
      conditionalNote: offer.conditionalNote,
      placeOfPostingText: offer.placeOfPostingText,
      probationText: offer.probationText,
      conditionsOfOffer: [...offer.conditionsOfOffer],
      acceptanceText: offer.acceptanceText,
      closingText: offer.closingText,
      signeeName: offer.signeeName,
      signeeTitle: offer.signeeTitle,
      signeeEmail: offer.signeeEmail,
      signeePhone: offer.signeePhone,
    });
    setShowEditContentModal(true);
  };

  const handleSaveEditContent = () => {
    if (!selectedOffer || !editDraft) return;
    offerLetterService.updateContent(
      selectedOffer.id,
      editDraft as any,
      currentUser?.name || currentRole,
      currentRole
    );
    toast.success("Offer letter content updated");
    setShowEditContentModal(false);
    setEditDraft(null);
  };

  const handleSendOffer = (offer: OfferLetter) => {
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
                        {offer.status === "Draft" && canEditContent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditContent(offer)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        {offer.status === "Draft" && (
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
                  {selectedOffer.status === "Draft" && canEditContent && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setShowPreviewModal(false); handleOpenEditContent(selectedOffer); }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Content
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("Download started")}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreviewModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-white p-8 border border-gray-300">
                {/* Letterhead */}
                <div className="border-b-2 border-blue-600 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-blue-600">{selectedOffer.companyName}</h1>
                  <p className="text-sm text-gray-600 mt-1">Professional Car Care | Subscription-Based Home Wash</p>
                  <p className="text-xs text-gray-500">
                    Mobile: {selectedOffer.companyPhone} | Email: {selectedOffer.companyEmail}
                  </p>
                </div>

                {/* Date */}
                <div className="text-right text-sm text-gray-700 mb-6">
                  <strong>
                    {new Date(selectedOffer.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </strong>
                </div>

                {/* Candidate Address */}
                <div className="mb-6 text-sm">
                  <p className="font-semibold">{selectedOffer.candidateName}</p>
                  <p className="text-gray-600">{selectedOffer.address}</p>
                  <p className="text-gray-600">
                    {selectedOffer.mobile && <>Mobile: {selectedOffer.mobile} | </>}Email: {selectedOffer.email}
                  </p>
                </div>

                <p className="text-sm mb-4">Dear {selectedOffer.candidateName},</p>

                {/* Offer banner */}
                <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-6">
                  <p className="font-bold text-blue-900 text-sm">
                    Letter of Offer — {selectedOffer.designation}, with effective date{" "}
                    {new Date(selectedOffer.dateOfJoining).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {/* Body */}
                <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                  <p>{selectedOffer.introText}</p>

                  <p className="italic text-gray-500">{selectedOffer.conditionalNote}</p>

                  {/* 1. Position Details */}
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">1. Position Details</h4>
                    <table className="w-full text-sm border border-gray-300">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold bg-gray-50 w-1/3">Designation</td>
                          <td className="py-2 px-3">{selectedOffer.designation}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold bg-gray-50">Department / Function</td>
                          <td className="py-2 px-3">{selectedOffer.department}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold bg-gray-50">Reporting To</td>
                          <td className="py-2 px-3">{selectedOffer.reportingManager}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold bg-gray-50">Place of Posting</td>
                          <td className="py-2 px-3">{selectedOffer.placeOfPostingText}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold bg-gray-50">Date of Joining</td>
                          <td className="py-2 px-3">
                            {new Date(selectedOffer.dateOfJoining).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold bg-gray-50">Employment Type</td>
                          <td className="py-2 px-3">{selectedOffer.employmentType}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Compensation & Benefits */}
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">2. Compensation &amp; Benefits</h4>
                    <table className="w-full text-sm border border-gray-300">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold bg-gray-50 w-1/3">Fixed Annual CTC</td>
                          <td className="py-2 px-3 font-semibold">
                            ₹{(selectedOffer?.salaryComponents?.annualCTC ?? 0).toLocaleString("en-IN")}/- Annually
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold bg-gray-50">Variable / Incentive</td>
                          <td className="py-2 px-3">As per Incentive Policy</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold bg-gray-50">Provident Fund (PF)</td>
                          <td className="py-2 px-3">As per the EPF Act.</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold bg-gray-50">ESIC</td>
                          <td className="py-2 px-3">Applicable as per statutory limits under the ESI Act, 1948.</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold bg-gray-50">Annual Leave</td>
                          <td className="py-2 px-3">As per Leave Policy</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold bg-gray-50">Working Hours</td>
                          <td className="py-2 px-3">{selectedOffer.workingHours}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="italic text-xs text-gray-500 mt-2">
                      Note: Compensation is strictly confidential. Disclosure to any third party other than immediate family constitutes a breach of this offer and may result in disciplinary action.
                    </p>
                  </div>

                  {/* HR-only detailed breakdown — not part of the printed/sent letter */}
                  {canEditContent && (
                    <div className="print:hidden">
                      <button
                        type="button"
                        onClick={() => setShowInternalBreakdown((v) => !v)}
                        className="text-xs font-semibold text-purple-700 hover:underline"
                      >
                        {showInternalBreakdown ? "▾" : "▸"} Internal View Only — Detailed Monthly Breakdown (not shown to candidate)
                      </button>
                      {showInternalBreakdown && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-2">
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b"><td className="py-1">Basic Salary</td><td className="text-right py-1">₹{(selectedOffer?.salaryComponents?.basic ?? 0).toLocaleString()}</td></tr>
                              <tr className="border-b"><td className="py-1">HRA</td><td className="text-right py-1">₹{(selectedOffer?.salaryComponents?.hra ?? 0).toLocaleString()}</td></tr>
                              <tr className="border-b"><td className="py-1">Conveyance Allowance</td><td className="text-right py-1">₹{(selectedOffer?.salaryComponents?.conveyance ?? 0).toLocaleString()}</td></tr>
                              {selectedOffer.salaryComponents.medical > 0 && (
                                <tr className="border-b"><td className="py-1">Medical Allowance</td><td className="text-right py-1">₹{(selectedOffer?.salaryComponents?.medical ?? 0).toLocaleString()}</td></tr>
                              )}
                              {selectedOffer.salaryComponents.specialAllowance > 0 && (
                                <tr className="border-b"><td className="py-1">Special Allowance</td><td className="text-right py-1">₹{(selectedOffer?.salaryComponents?.specialAllowance ?? 0).toLocaleString()}</td></tr>
                              )}
                              <tr className="border-b border-t-2 border-gray-400 font-semibold"><td className="py-1">Gross Salary (Monthly)</td><td className="text-right py-1">₹{(selectedOffer?.salaryComponents?.monthlyGross ?? 0).toLocaleString()}</td></tr>
                              <tr className="border-b text-red-600"><td className="py-1">PF (Employee)</td><td className="text-right py-1">-₹{(selectedOffer?.salaryComponents?.employeePF ?? 0).toLocaleString()}</td></tr>
                              {selectedOffer.salaryComponents.employeeESIC > 0 && (
                                <tr className="border-b text-red-600"><td className="py-1">ESIC (Employee)</td><td className="text-right py-1">-₹{(selectedOffer?.salaryComponents?.employeeESIC ?? 0).toLocaleString()}</td></tr>
                              )}
                              <tr className="border-b text-red-600"><td className="py-1">Professional Tax</td><td className="text-right py-1">-₹{(selectedOffer?.salaryComponents?.professionalTax ?? 0).toLocaleString()}</td></tr>
                              <tr className="border-t-2 border-gray-400 font-bold text-green-700"><td className="py-2">Net Take Home (Monthly)</td><td className="text-right py-2">₹{(selectedOffer?.salaryComponents?.netTakeHome ?? 0).toLocaleString()}</td></tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Probation & Confirmation */}
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">3. Probation &amp; Confirmation</h4>
                    <p>{selectedOffer.probationText}</p>
                  </div>

                  {/* 4. Conditions of This Offer */}
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">4. Conditions of This Offer</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedOffer.conditionsOfOffer.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 5. Acceptance */}
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">5. Acceptance</h4>
                    <p>{selectedOffer.acceptanceText}</p>
                  </div>

                  <p>{selectedOffer.closingText}</p>

                  <div className="mt-8">
                    <p>Warm regards,</p>
                    <div className="mt-8">
                      <p className="font-semibold">{selectedOffer.signeeName}</p>
                      <p className="text-sm">{selectedOffer.signeeTitle} | {selectedOffer.companyName}</p>
                      <p className="text-sm">Email: {selectedOffer.signeeEmail} | Phone: {selectedOffer.signeePhone}</p>
                    </div>
                  </div>
                </div>

                {/* Acceptance Section */}
                <div className="mt-12 pt-8 border-t-2 border-gray-300">
                  <h4 className="font-semibold mb-4">ACCEPTANCE</h4>
                  <p className="text-sm mb-4">
                    I, {selectedOffer.candidateName}, accept the above offer of employment on the terms and conditions
                    stated, and confirm that I have read and understood all clauses.
                  </p>
                  <div className="grid grid-cols-1 gap-4 mt-6 text-sm">
                    <div className="border-t border-gray-400 pt-2 w-64">Signature</div>
                    <div className="border-t border-gray-400 pt-2 w-64">Date</div>
                    <div className="border-t border-gray-400 pt-2 w-64">Expected Date of Joining</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Content Modal — HR / Super Admin only */}
      {showEditContentModal && selectedOffer && editDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-3xl my-8">
            <CardHeader className="border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <CardTitle>Edit Offer Letter Content - {selectedOffer.id}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowEditContentModal(false); setEditDraft(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <p className="text-xs text-gray-500">
                Every field below was auto-filled from the employee's data and company policy. Edit anything here to
                customize this specific letter — it won't affect the template for future offers.
              </p>

              <div>
                <Label>Introduction Paragraph</Label>
                <Textarea
                  value={editDraft.introText || ""}
                  onChange={(e) => setEditDraft({ ...editDraft, introText: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Conditional Offer Note</Label>
                <Textarea
                  value={editDraft.conditionalNote || ""}
                  onChange={(e) => setEditDraft({ ...editDraft, conditionalNote: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Employment Type</Label>
                <Input
                  value={editDraft.employmentType || ""}
                  onChange={(e) => setEditDraft({ ...editDraft, employmentType: e.target.value })}
                />
              </div>

              <div>
                <Label>Place of Posting</Label>
                <Textarea
                  value={editDraft.placeOfPostingText || ""}
                  onChange={(e) => setEditDraft({ ...editDraft, placeOfPostingText: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Probation (months)</Label>
                  <Input
                    type="number" min={0}
                    value={editDraft.probationMonths ?? 0}
                    onChange={(e) => setEditDraft({ ...editDraft, probationMonths: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Notice — During Probation (months)</Label>
                  <Input
                    type="number" min={0}
                    value={editDraft.noticeDuringProbationMonths ?? 0}
                    onChange={(e) => setEditDraft({ ...editDraft, noticeDuringProbationMonths: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Notice — After Confirmation (months)</Label>
                  <Input
                    type="number" min={0}
                    value={editDraft.noticeAfterConfirmationMonths ?? 0}
                    onChange={(e) => setEditDraft({ ...editDraft, noticeAfterConfirmationMonths: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Probation &amp; Confirmation Clause Text</Label>
                <Textarea
                  value={editDraft.probationText || ""}
                  onChange={(e) => setEditDraft({ ...editDraft, probationText: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-gray-400 mt-1">
                  This text doesn't auto-update from the numbers above — edit it directly if you change the terms.
                </p>
              </div>

              <div>
                <Label>Conditions of This Offer</Label>
                <div className="space-y-2">
                  {(editDraft.conditionsOfOffer || []).map((cond, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Textarea
                        value={cond}
                        rows={2}
                        onChange={(e) => {
                          const updated = [...(editDraft.conditionsOfOffer || [])];
                          updated[idx] = e.target.value;
                          setEditDraft({ ...editDraft, conditionsOfOffer: updated });
                        }}
                      />
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => {
                          const updated = (editDraft.conditionsOfOffer || []).filter((_, i) => i !== idx);
                          setEditDraft({ ...editDraft, conditionsOfOffer: updated });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm" variant="outline"
                    onClick={() => setEditDraft({ ...editDraft, conditionsOfOffer: [...(editDraft.conditionsOfOffer || []), ""] })}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Condition
                  </Button>
                </div>
              </div>

              <div>
                <Label>Acceptance Paragraph</Label>
                <Textarea
                  value={editDraft.acceptanceText || ""}
                  onChange={(e) => setEditDraft({ ...editDraft, acceptanceText: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Closing Paragraph</Label>
                <Textarea
                  value={editDraft.closingText || ""}
                  onChange={(e) => setEditDraft({ ...editDraft, closingText: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Signee Name</Label>
                  <Input value={editDraft.signeeName || ""} onChange={(e) => setEditDraft({ ...editDraft, signeeName: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Signee Title</Label>
                  <Input value={editDraft.signeeTitle || ""} onChange={(e) => setEditDraft({ ...editDraft, signeeTitle: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Signee Email</Label>
                  <Input value={editDraft.signeeEmail || ""} onChange={(e) => setEditDraft({ ...editDraft, signeeEmail: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Signee Phone</Label>
                  <Input value={editDraft.signeePhone || ""} onChange={(e) => setEditDraft({ ...editDraft, signeePhone: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button onClick={handleSaveEditContent} className="bg-purple-600 hover:bg-purple-700">
                  Save Content
                </Button>
                <Button variant="outline" onClick={() => { setShowEditContentModal(false); setEditDraft(null); }}>
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
