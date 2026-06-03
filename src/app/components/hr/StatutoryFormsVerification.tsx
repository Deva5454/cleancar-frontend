/**
 * Statutory Forms Verification - HR View
 * Part 2: HR Verification of Statutory Forms
 * Part 3: HR Statutory Filing Workflow
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Shield,
  Eye,
  Edit,
  Send,
  AlertCircle,
  Info,
  Download,
  Upload,
  Check,
  X as XIcon,
  List,
} from "lucide-react";
import { statutoryFormsService } from "../../services/statutoryFormsService";
import type { StatutoryFormSubmission } from "../../services/statutoryFormsService";
import { onboardingChecklistService } from "../../services/onboardingChecklistService";
import { toast } from "sonner";

type StatutoryFormStatus =
  | "Not Submitted"
  | "Submitted by Employee"
  | "Verified by HR"
  | "Filed with Authority"
  | "Rejected";

type PFFormData = {
  status: StatutoryFormStatus;
  submittedOn?: string;
  fullName: string;
  fatherOrHusbandName: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  mobile: string;
  email: string;
  aadhaar: string;
  pan: string;
  bankAccount: string;
  ifsc: string;
  bankName: string;
  uan: string;
  isFirstJob: boolean;
  previousEmployer?: string;
  previousPFAccount?: string;
  previousState?: string;
  nominees: Array<{
    name: string;
    relationship: string;
    dob: string;
    address: string;
    sharePercentage: number;
  }>;
  verifiedBy?: string;
  verifiedOn?: string;
  filedOn?: string;
  filedBy?: string;
  referenceNumber?: string;
  uanAllotted?: string;
};

type ESICFormData = {
  status: StatutoryFormStatus;
  submittedOn?: string;
  fullName: string;
  dob: string;
  fatherOrHusbandName: string;
  mobile: string;
  aadhaar: string;
  permanentAddress: string;
  dispensaryName: string;
  dispensaryCity: string;
  familyMembers: Array<{
    name: string;
    relationship: string;
    dob: string;
    gender: string;
    residing: string;
  }>;
  verifiedBy?: string;
  verifiedOn?: string;
  filedOn?: string;
  filedBy?: string;
  ipNumber?: string;
};

export function StatutoryFormsVerification() {
  // Verification Queue State
  const [submissions, setSubmissions] = useState<StatutoryFormSubmission[]>([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectQueueModal, setShowRejectQueueModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<StatutoryFormSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Load submissions from service
  useEffect(() => {
    const loadSubmissions = () => {
      const pending = statutoryFormsService.getPending();
      setSubmissions(pending);
    };

    loadSubmissions();

    // Subscribe to changes
    const unsubscribe = statutoryFormsService.subscribe(() => {
      loadSubmissions();
    });

    return unsubscribe;
  }, []);

  const [pfForm, setPfForm] = useState<PFFormData>({
    status: "Submitted by Employee",
    submittedOn: "2026-03-15 10:30 AM",
    fullName: "Rahul Sharma",
    fatherOrHusbandName: "Vijay Sharma",
    dob: "1995-06-15",
    gender: "Male",
    maritalStatus: "Single",
    mobile: "9876543210",
    email: "rahul.sharma@cleancar360.com",
    aadhaar: "1234 5678 9012",
    pan: "ABCDE1234F",
    bankAccount: "1234567890",
    ifsc: "HDFC0001234",
    bankName: "HDFC Bank",
    uan: "100123456789",
    isFirstJob: false,
    previousEmployer: "ABC Technologies Pvt Ltd",
    previousPFAccount: "MH/BAN/0098765/000/0001234",
    previousState: "Maharashtra",
    nominees: [
      {
        name: "Sunita Sharma",
        relationship: "Mother",
        dob: "1970-05-20",
        address: "123, MG Road, Surat, Gujarat - 395001",
        sharePercentage: 100,
      },
    ],
  });

  const [esicForm, setEsicForm] = useState<ESICFormData>({
    status: "Submitted by Employee",
    submittedOn: "2026-03-15 10:45 AM",
    fullName: "Rahul Sharma",
    dob: "1995-06-15",
    fatherOrHusbandName: "Vijay Sharma",
    mobile: "9876543210",
    aadhaar: "1234 5678 9012",
    permanentAddress: "123, MG Road, Surat, Gujarat - 395001",
    dispensaryName: "ESIC Hospital Adajan",
    dispensaryCity: "Surat",
    familyMembers: [
      {
        name: "Sunita Sharma",
        relationship: "Mother",
        dob: "1970-05-20",
        gender: "Female",
        residing: "Yes",
      },
    ],
  });

  // PF Verification States
  const [pfChecklist, setPfChecklist] = useState({
    aadhaarVerified: false,
    panVerified: false,
    bankVerified: false,
    uanVerified: false,
    nomineeComplete: false,
    signatureObtained: false,
  });
  const [pfRemarks, setPfRemarks] = useState("");

  // ESIC Verification States
  const [esicChecklist, setEsicChecklist] = useState({
    aadhaarVerified: false,
    familyVerified: false,
    dispensaryConfirmed: false,
    signatureObtained: false,
    photoAffixed: false,
  });
  const [esicRemarks, setEsicRemarks] = useState("");

  // Filing States
  const [showPFFilingModal, setShowPFFilingModal] = useState(false);
  const [showESICFilingModal, setShowESICFilingModal] = useState(false);
  const [pfFilingMode, setPfFilingMode] = useState("Online via EPFO Unified Portal");
  const [pfFilingDate, setPfFilingDate] = useState(new Date().toISOString().split("T")[0]);
  const [pfReferenceNumber, setPfReferenceNumber] = useState("");
  const [pfFilingRemarks, setPfFilingRemarks] = useState("");
  const [esicFilingMode, setEsicFilingMode] = useState("Online via ESIC Portal");
  const [esicFilingDate, setEsicFilingDate] = useState(new Date().toISOString().split("T")[0]);
  const [esicIPNumber, setEsicIPNumber] = useState("");
  const [esicFilingRemarks, setEsicFilingRemarks] = useState("");

  // Rejection States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState<"PF" | "ESIC">("PF");
  const [rejectReasons, setRejectReasons] = useState<string[]>([]);
  const [rejectInstructions, setRejectInstructions] = useState("");

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editType, setEditType] = useState<"PF" | "ESIC">("PF");

  const getStatusBadge = (status: StatutoryFormStatus) => {
    const config = {
      "Not Submitted": { bg: "bg-gray-100 text-gray-800", icon: Clock },
      "Submitted by Employee": { bg: "bg-amber-100 text-amber-800", icon: FileText },
      "Verified by HR": { bg: "bg-blue-100 text-blue-800", icon: CheckCircle },
      "Filed with Authority": { bg: "bg-green-100 text-green-800", icon: Send },
      Rejected: { bg: "bg-red-100 text-red-800", icon: XCircle },
    };
    const { bg, icon: Icon } = config[status];
    return (
      <Badge className={bg}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const allPFChecklistCompleted = Object.values(pfChecklist).every((v) => v === true);
  const allESICChecklistCompleted = Object.values(esicChecklist).every((v) => v === true);

  const handleVerifyPF = () => {
    if (!allPFChecklistCompleted) {
      toast.info("Please complete all checklist items before verifying");
      return;
    }
    setPfForm({
      ...pfForm,
      status: "Verified by HR",
      verifiedBy: "Sneha Gupta (HR Manager)",
      verifiedOn: new Date().toLocaleString("en-IN"),
    });
    toast.success("✅ PF Declaration verified successfully for Rahul Sharma!");
  };

  const handleVerifyESIC = () => {
    if (!allESICChecklistCompleted) {
      toast.info("Please complete all checklist items before verifying");
      return;
    }
    setEsicForm({
      ...esicForm,
      status: "Verified by HR",
      verifiedBy: "Sneha Gupta (HR Manager)",
      verifiedOn: new Date().toLocaleString("en-IN"),
    });
    toast.success("✅ ESIC Declaration verified successfully for Rahul Sharma!");
  };

  const handleReject = (type: "PF" | "ESIC") => {
    setRejectType(type);
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (rejectReasons.length === 0) {
      toast.error("Please select at least one rejection reason");
      return;
    }
    if (!rejectInstructions.trim()) {
      toast.error("Please provide correction instructions");
      return;
    }

    if (rejectType === "PF") {
      setPfForm({ ...pfForm, status: "Rejected" });
      toast.error(
        `❌ PF Declaration rejected for Rahul Sharma.\n\nReasons: ${rejectReasons.join(", ")}\n\nCorrection request sent to employee.`
      );
    } else {
      setEsicForm({ ...esicForm, status: "Rejected" });
      toast.error(
        `❌ ESIC Declaration rejected for Rahul Sharma.\n\nReasons: ${rejectReasons.join(", ")}\n\nCorrection request sent to employee.`
      );
    }

    setShowRejectModal(false);
    setRejectReasons([]);
    setRejectInstructions("");
  };

  const handleFilePF = () => {
    if (!pfReferenceNumber.trim()) {
      toast.info("Please enter the ECR/Acknowledgement Reference Number");
      return;
    }
    setPfForm({
      ...pfForm,
      status: "Filed with Authority",
      filedOn: pfFilingDate,
      filedBy: "Sneha Gupta (HR Manager)",
      referenceNumber: pfReferenceNumber,
    });
    setShowPFFilingModal(false);
    toast.success(
      `✅ PF Form 11 filing recorded successfully!\n\nEmployee: Rahul Sharma\nFiling Mode: ${pfFilingMode}\nReference: ${pfReferenceNumber}\n\nThis record has been added to the employee ledger.`
    );
  };

  const handleFileESIC = () => {
    if (!esicIPNumber.trim()) {
      toast.success("Please enter the IP Number assigned by ESIC");
      return;
    }
    setEsicForm({
      ...esicForm,
      status: "Filed with Authority",
      filedOn: esicFilingDate,
      filedBy: "Sneha Gupta (HR Manager)",
      ipNumber: esicIPNumber,
    });
    setShowESICFilingModal(false);
    toast.success(
      `✅ ESIC Form 1 filing recorded successfully!\n\nEmployee: Rahul Sharma\nFiling Mode: ${esicFilingMode}\nIP Number: ${esicIPNumber}\n\nThis record has been added to the employee ledger.`
    );
  };

  // Verification Queue Handlers
  const handleVerifySubmission = (submission: StatutoryFormSubmission) => {
    setSelectedSubmission(submission);
    setShowVerifyModal(true);
  };

  const handleConfirmVerify = () => {
    if (!selectedSubmission) return;

    // Verify in statutory service
    statutoryFormsService.verify(selectedSubmission.id, "Sneha Gupta (HR Manager)");

    // Update onboarding checklist
    const taskName = selectedSubmission.formType === "PF Form 11"
      ? "PF Form 11 (Statutory)"
      : "ESIC Form 1 (Statutory)";

    const tasks = onboardingChecklistService.getByEmployeeId(selectedSubmission.employeeId);
    const updatedTasks = tasks.map(task =>
      task.task === taskName
        ? { ...task, status: "Completed" as const, completedOn: new Date().toISOString() }
        : task
    );
    onboardingChecklistService.update(selectedSubmission.employeeId, updatedTasks);

    toast.success(`${selectedSubmission.formType} verified for ${selectedSubmission.employeeName}`);
    setShowVerifyModal(false);
    setSelectedSubmission(null);
  };

  const handleRejectSubmission = (submission: StatutoryFormSubmission) => {
    setSelectedSubmission(submission);
    setShowRejectQueueModal(true);
  };

  const handleConfirmRejectQueue = () => {
    if (!selectedSubmission) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    // Reject in statutory service
    statutoryFormsService.reject(selectedSubmission.id, "Sneha Gupta (HR Manager)", rejectionReason);

    // Update onboarding checklist to show rejection
    const taskName = selectedSubmission.formType === "PF Form 11"
      ? "PF Form 11 (Statutory)"
      : "ESIC Form 1 (Statutory)";

    const tasks = onboardingChecklistService.getByEmployeeId(selectedSubmission.employeeId);
    const updatedTasks = tasks.map(task =>
      task.task === taskName
        ? { ...task, status: "Not Started" as const }
        : task
    );
    onboardingChecklistService.update(selectedSubmission.employeeId, updatedTasks);

    toast.error(`${selectedSubmission.formType} rejected for ${selectedSubmission.employeeName}. Reason: ${rejectionReason}`);
    setShowRejectQueueModal(false);
    setSelectedSubmission(null);
    setRejectionReason("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Statutory Forms - Rahul Sharma (EMP001)</h3>
          <p className="text-sm text-gray-600 mt-1">Verify employee declarations for PF and ESIC</p>
        </div>
        <BackButton />
      </div>

      {/* Tabs for PF and ESIC */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Verification Queue ({submissions.length})
          </TabsTrigger>
          <TabsTrigger value="pf" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            PF Declaration (Form 11)
          </TabsTrigger>
          <TabsTrigger value="esic" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            ESIC Declaration (Form 1)
          </TabsTrigger>
        </TabsList>

        {/* Verification Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader className="border-b bg-amber-50">
              <CardTitle>Pending Statutory Form Submissions</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Review and verify PF Form 11 and ESIC Form 1 submissions from employees
              </p>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">No Pending Submissions</h3>
                  <p className="text-sm text-gray-600">
                    All statutory form submissions have been processed.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Form Type</TableHead>
                      <TableHead>Submitted On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.employeeName}</TableCell>
                        <TableCell>{submission.employeeId}</TableCell>
                        <TableCell>{submission.formType}</TableCell>
                        <TableCell>{new Date(submission.submittedOn).toLocaleString("en-IN")}</TableCell>
                        <TableCell>
                          <Badge className="bg-amber-100 text-amber-800">
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => handleVerifySubmission(submission)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() => handleRejectSubmission(submission)}
                            >
                              <XIcon className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PF Form Tab */}
        <TabsContent value="pf" className="space-y-4">
          <Card>
            <CardHeader className="border-b bg-blue-50">
              <div className="flex items-center justify-between">
                <CardTitle>PF Declaration (Form 11)</CardTitle>
                {getStatusBadge(pfForm.status)}
              </div>
              {pfForm.submittedOn && (
                <p className="text-sm text-gray-600 mt-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Submitted on {pfForm.submittedOn}
                </p>
              )}
              {pfForm.verifiedOn && (
                <p className="text-sm text-green-600 mt-1">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Verified by {pfForm.verifiedBy} on {pfForm.verifiedOn}
                </p>
              )}
              {pfForm.filedOn && (
                <p className="text-sm text-green-600 mt-1">
                  <Send className="w-4 h-4 inline mr-1" />
                  Filed with EPFO on {pfForm.filedOn} by {pfForm.filedBy}
                </p>
              )}
            </CardHeader>

            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              {/* Submitted Data Display */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Personal Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Full Name</Label>
                      <p className="font-medium text-gray-900">{pfForm.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Father's/Husband's Name</Label>
                      <p className="font-medium text-gray-900">{pfForm.fatherOrHusbandName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Date of Birth</Label>
                      <p className="font-medium text-gray-900">{pfForm.dob}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Gender</Label>
                      <p className="font-medium text-gray-900">{pfForm.gender}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Marital Status</Label>
                      <p className="font-medium text-gray-900">{pfForm.maritalStatus}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Mobile</Label>
                      <p className="font-medium text-gray-900">{pfForm.mobile}</p>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs text-gray-500">Email</Label>
                      <p className="font-medium text-gray-900">{pfForm.email}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Identity Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Aadhaar Number</Label>
                      <p className="font-medium text-gray-900">
                        {pfForm.aadhaar} <Badge className="ml-2 text-xs bg-gray-100 text-gray-600">Auto-filled</Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">PAN Number</Label>
                      <p className="font-medium text-gray-900">
                        {pfForm.pan} <Badge className="ml-2 text-xs bg-gray-100 text-gray-600">Auto-filled</Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">UAN</Label>
                      <p className="font-medium text-gray-900">{pfForm.uan || "New UAN to be assigned"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Bank Account</Label>
                      <p className="font-medium text-gray-900">
                        {pfForm.bankAccount} <Badge className="ml-2 text-xs bg-gray-100 text-gray-600">Auto-filled</Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">IFSC Code</Label>
                      <p className="font-medium text-gray-900">{pfForm.ifsc}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Bank Name</Label>
                      <p className="font-medium text-gray-900">{pfForm.bankName}</p>
                    </div>
                  </div>
                </div>

                {!pfForm.isFirstJob && pfForm.previousEmployer && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Previous Employment</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">Previous Employer</Label>
                        <p className="font-medium text-gray-900">{pfForm.previousEmployer}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Previous State</Label>
                        <p className="font-medium text-gray-900">{pfForm.previousState}</p>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs text-gray-500">Previous PF Account Number</Label>
                        <p className="font-medium text-gray-900">{pfForm.previousPFAccount}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Nominee Details</h4>
                  {pfForm.nominees.map((nominee, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Name</Label>
                          <p className="font-medium text-gray-900">{nominee.name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Relationship</Label>
                          <p className="font-medium text-gray-900">{nominee.relationship}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Date of Birth</Label>
                          <p className="font-medium text-gray-900">{nominee.dob}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Share</Label>
                          <p className="font-medium text-gray-900">{nominee.sharePercentage}%</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-500">Address</Label>
                          <p className="font-medium text-gray-900">{nominee.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HR Verification Panel */}
              {pfForm.status === "Submitted by Employee" && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">HR Verification Checklist</h4>
                  <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={pfChecklist.aadhaarVerified}
                        onCheckedChange={(checked) => setPfChecklist({ ...pfChecklist, aadhaarVerified: !!checked })}
                        id="pf-aadhaar"
                      />
                      <label htmlFor="pf-aadhaar" className="text-sm cursor-pointer">
                        Aadhaar matches physical copy
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={pfChecklist.panVerified}
                        onCheckedChange={(checked) => setPfChecklist({ ...pfChecklist, panVerified: !!checked })}
                        id="pf-pan"
                      />
                      <label htmlFor="pf-pan" className="text-sm cursor-pointer">
                        PAN matches physical copy
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={pfChecklist.bankVerified}
                        onCheckedChange={(checked) => setPfChecklist({ ...pfChecklist, bankVerified: !!checked })}
                        id="pf-bank"
                      />
                      <label htmlFor="pf-bank" className="text-sm cursor-pointer">
                        Bank account details verified with cancelled cheque
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={pfChecklist.uanVerified}
                        onCheckedChange={(checked) => setPfChecklist({ ...pfChecklist, uanVerified: !!checked })}
                        id="pf-uan"
                      />
                      <label htmlFor="pf-uan" className="text-sm cursor-pointer">
                        Previous UAN verified (if applicable)
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={pfChecklist.nomineeComplete}
                        onCheckedChange={(checked) => setPfChecklist({ ...pfChecklist, nomineeComplete: !!checked })}
                        id="pf-nominee"
                      />
                      <label htmlFor="pf-nominee" className="text-sm cursor-pointer">
                        Nominee details complete and signed
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={pfChecklist.signatureObtained}
                        onCheckedChange={(checked) =>
                          setPfChecklist({ ...pfChecklist, signatureObtained: !!checked })
                        }
                        id="pf-signature"
                      />
                      <label htmlFor="pf-signature" className="text-sm cursor-pointer">
                        Employee signature obtained on physical Form 11
                      </label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Remarks (Optional)</Label>
                    <Textarea
                      value={pfRemarks}
                      onChange={(e) => setPfRemarks(e.target.value)}
                      placeholder="Add any notes or discrepancies found during verification..."
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleVerifyPF}
                      disabled={!allPFChecklistCompleted}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify & Approve
                    </Button>
                    <Button variant="outline" className="border-red-300 text-red-600" onClick={() => handleReject("PF")}>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject & Request Correction
                    </Button>
                    <Button variant="outline" onClick={() => setShowEditModal(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit on Behalf of Employee
                    </Button>
                  </div>
                </div>
              )}

              {/* File with Authority Button */}
              {pfForm.status === "Verified by HR" && (
                <div className="border-t pt-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-900">Form verified and ready for filing</p>
                      <p className="text-sm text-green-700 mt-1">
                        Proceed to file this form with the Employees' Provident Fund Organisation
                      </p>
                    </div>
                    <Button onClick={() => setShowPFFilingModal(true)} className="bg-green-600 hover:bg-green-700">
                      <Send className="w-4 h-4 mr-2" />
                      File with Authority — PF
                    </Button>
                  </div>
                </div>
              )}

              {/* Filed Status */}
              {pfForm.status === "Filed with Authority" && (
                <div className="border-t pt-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-blue-900">Filed with EPFO</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Filed On:</span>
                        <span className="ml-2 font-medium text-gray-900">{pfForm.filedOn}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Filed By:</span>
                        <span className="ml-2 font-medium text-gray-900">{pfForm.filedBy}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Reference Number:</span>
                        <span className="ml-2 font-medium text-blue-700">{pfForm.referenceNumber}</span>
                      </div>
                      {pfForm.uanAllotted && (
                        <div className="col-span-2">
                          <span className="text-gray-600">UAN Allotted:</span>
                          <span className="ml-2 font-medium text-blue-700">{pfForm.uanAllotted}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESIC Form Tab */}
        <TabsContent value="esic" className="space-y-4">
          <Card>
            <CardHeader className="border-b bg-teal-50">
              <div className="flex items-center justify-between">
                <CardTitle>ESIC Declaration (Form 1)</CardTitle>
                {getStatusBadge(esicForm.status)}
              </div>
              {esicForm.submittedOn && (
                <p className="text-sm text-gray-600 mt-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Submitted on {esicForm.submittedOn}
                </p>
              )}
              {esicForm.verifiedOn && (
                <p className="text-sm text-green-600 mt-1">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Verified by {esicForm.verifiedBy} on {esicForm.verifiedOn}
                </p>
              )}
              {esicForm.filedOn && (
                <p className="text-sm text-green-600 mt-1">
                  <Send className="w-4 h-4 inline mr-1" />
                  Filed with ESIC on {esicForm.filedOn} by {esicForm.filedBy}
                </p>
              )}
            </CardHeader>

            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              {/* Submitted Data Display */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Personal Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Full Name</Label>
                      <p className="font-medium text-gray-900">{esicForm.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Father's/Husband's Name</Label>
                      <p className="font-medium text-gray-900">{esicForm.fatherOrHusbandName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Date of Birth</Label>
                      <p className="font-medium text-gray-900">{esicForm.dob}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Mobile</Label>
                      <p className="font-medium text-gray-900">{esicForm.mobile}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Aadhaar</Label>
                      <p className="font-medium text-gray-900">
                        {esicForm.aadhaar} <Badge className="ml-2 text-xs bg-gray-100 text-gray-600">Auto-filled</Badge>
                      </p>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs text-gray-500">Permanent Address</Label>
                      <p className="font-medium text-gray-900">{esicForm.permanentAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Dispensary Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Dispensary Name</Label>
                      <p className="font-medium text-gray-900">{esicForm.dispensaryName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">City</Label>
                      <p className="font-medium text-gray-900">{esicForm.dispensaryCity}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Family Members Declared ({esicForm.familyMembers.length})
                  </h4>
                  {esicForm.familyMembers.map((member, index) => (
                    <div key={index} className="p-4 bg-teal-50 rounded-lg border border-teal-200 mb-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Name</Label>
                          <p className="font-medium text-gray-900">{member.name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Relationship</Label>
                          <p className="font-medium text-gray-900">{member.relationship}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Gender</Label>
                          <p className="font-medium text-gray-900">{member.gender}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Date of Birth</Label>
                          <p className="font-medium text-gray-900">{member.dob}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Residing with Employee</Label>
                          <p className="font-medium text-gray-900">{member.residing}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HR Verification Panel */}
              {esicForm.status === "Submitted by Employee" && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">HR Verification Checklist</h4>
                  <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={esicChecklist.aadhaarVerified}
                        onCheckedChange={(checked) =>
                          setEsicChecklist({ ...esicChecklist, aadhaarVerified: !!checked })
                        }
                        id="esic-aadhaar"
                      />
                      <label htmlFor="esic-aadhaar" className="text-sm cursor-pointer">
                        Aadhaar matches physical copy
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={esicChecklist.familyVerified}
                        onCheckedChange={(checked) =>
                          setEsicChecklist({ ...esicChecklist, familyVerified: !!checked })
                        }
                        id="esic-family"
                      />
                      <label htmlFor="esic-family" className="text-sm cursor-pointer">
                        Family member details verified
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={esicChecklist.dispensaryConfirmed}
                        onCheckedChange={(checked) =>
                          setEsicChecklist({ ...esicChecklist, dispensaryConfirmed: !!checked })
                        }
                        id="esic-dispensary"
                      />
                      <label htmlFor="esic-dispensary" className="text-sm cursor-pointer">
                        Dispensary selection confirmed
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={esicChecklist.signatureObtained}
                        onCheckedChange={(checked) =>
                          setEsicChecklist({ ...esicChecklist, signatureObtained: !!checked })
                        }
                        id="esic-signature"
                      />
                      <label htmlFor="esic-signature" className="text-sm cursor-pointer">
                        Employee signature obtained on physical Form 1
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Checkbox
                        checked={esicChecklist.photoAffixed}
                        onCheckedChange={(checked) => setEsicChecklist({ ...esicChecklist, photoAffixed: !!checked })}
                        id="esic-photo"
                      />
                      <label htmlFor="esic-photo" className="text-sm cursor-pointer">
                        Photograph affixed on physical form
                      </label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Remarks (Optional)</Label>
                    <Textarea
                      value={esicRemarks}
                      onChange={(e) => setEsicRemarks(e.target.value)}
                      placeholder="Add any notes or discrepancies found during verification..."
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleVerifyESIC}
                      disabled={!allESICChecklistCompleted}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify & Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600"
                      onClick={() => handleReject("ESIC")}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject & Request Correction
                    </Button>
                    <Button variant="outline" onClick={() => setShowEditModal(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit on Behalf of Employee
                    </Button>
                  </div>
                </div>
              )}

              {/* File with Authority Button */}
              {esicForm.status === "Verified by HR" && (
                <div className="border-t pt-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-900">Form verified and ready for filing</p>
                      <p className="text-sm text-green-700 mt-1">
                        Proceed to file this form with the Employees' State Insurance Corporation
                      </p>
                    </div>
                    <Button onClick={() => setShowESICFilingModal(true)} className="bg-green-600 hover:bg-green-700">
                      <Send className="w-4 h-4 mr-2" />
                      File with Authority — ESIC
                    </Button>
                  </div>
                </div>
              )}

              {/* Filed Status */}
              {esicForm.status === "Filed with Authority" && (
                <div className="border-t pt-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-blue-900">Filed with ESIC</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Filed On:</span>
                        <span className="ml-2 font-medium text-gray-900">{esicForm.filedOn}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Filed By:</span>
                        <span className="ml-2 font-medium text-gray-900">{esicForm.filedBy}</span>
                      </div>
                      {esicForm.ipNumber && (
                        <div className="col-span-2">
                          <span className="text-gray-600">IP Number Assigned:</span>
                          <span className="ml-2 font-medium text-blue-700">{esicForm.ipNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PF Filing Modal */}
      {showPFFilingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>File PF Form 11 with EPFO</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPFFilingModal(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form Preview */}
              <div className="p-6 bg-gray-50 rounded-lg border space-y-4">
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold text-lg">EMPLOYEES' PROVIDENT FUND ORGANISATION</h3>
                  <p className="text-sm text-gray-600">Form 11 - Declaration & Nomination Form</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Employer Name:</strong> CleanCar 360°
                  </div>
                  <div>
                    <strong>PF Code:</strong> MH/BAN/0012345/000
                  </div>
                  <div>
                    <strong>Employee Name:</strong> {pfForm.fullName}
                  </div>
                  <div>
                    <strong>UAN:</strong> {pfForm.uan || "To be assigned"}
                  </div>
                  <div className="col-span-2">
                    <strong>Nominee:</strong> {pfForm.nominees[0].name} ({pfForm.nominees[0].relationship}) -
                    {pfForm.nominees[0].sharePercentage}%
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic text-center">
                  This is a preview. Actual form will be filed through EPFO Unified Portal.
                </p>
              </div>

              {/* Filing Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Filing Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label>Filing Mode *</Label>
                    <Select value={pfFilingMode} onValueChange={setPfFilingMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Online via EPFO Unified Portal">Online via EPFO Unified Portal</SelectItem>
                        <SelectItem value="Physical Submission">Physical Submission</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Filing Date *</Label>
                    <Input type="date" value={pfFilingDate} onChange={(e) => setPfFilingDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Filed By</Label>
                    <Input value="Sneha Gupta (HR Manager)" disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Reference / Acknowledgement Number *</Label>
                    <Input
                      value={pfReferenceNumber}
                      onChange={(e) => setPfReferenceNumber(e.target.value)}
                      placeholder="Enter reference number after filing"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Remarks (Optional)</Label>
                    <Textarea
                      value={pfFilingRemarks}
                      onChange={(e) => setPfFilingRemarks(e.target.value)}
                      placeholder="Any additional notes..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPFFilingModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleFilePF} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Filing Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ESIC Filing Modal */}
      {showESICFilingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>File ESIC Form 1 with ESIC</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowESICFilingModal(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form Preview */}
              <div className="p-6 bg-gray-50 rounded-lg border space-y-4">
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold text-lg">EMPLOYEES' STATE INSURANCE CORPORATION</h3>
                  <p className="text-sm text-gray-600">Form 1 - Declaration Form for Insurance</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Employer Name:</strong> CleanCar 360°
                  </div>
                  <div>
                    <strong>ESIC Code:</strong> 53000012345
                  </div>
                  <div>
                    <strong>Employee Name:</strong> {esicForm.fullName}
                  </div>
                  <div>
                    <strong>Family Members:</strong> {esicForm.familyMembers.length}
                  </div>
                  <div className="col-span-2">
                    <strong>Dispensary:</strong> {esicForm.dispensaryName}, {esicForm.dispensaryCity}
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic text-center">
                  This is a preview. Actual form will be filed through ESIC Portal.
                </p>
              </div>

              {/* Filing Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Filing Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label>Filing Mode *</Label>
                    <Select value={esicFilingMode} onValueChange={setEsicFilingMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Online via ESIC Portal">Online via ESIC Portal</SelectItem>
                        <SelectItem value="Physical Submission">Physical Submission</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Filing Date *</Label>
                    <Input type="date" value={esicFilingDate} onChange={(e) => setEsicFilingDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Filed By</Label>
                    <Input value="Sneha Gupta (HR Manager)" disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>IP Number Assigned by ESIC *</Label>
                    <Input
                      value={esicIPNumber}
                      onChange={(e) => setEsicIPNumber(e.target.value)}
                      placeholder="Enter 10-digit IP number"
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-500 mt-1">Insurance Person Number (e.g., 1234567890)</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Remarks (Optional)</Label>
                    <Textarea
                      value={esicFilingRemarks}
                      onChange={(e) => setEsicFilingRemarks(e.target.value)}
                      placeholder="Any additional notes..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowESICFilingModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleFileESIC} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Filing Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reject {rejectType} Declaration</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Issues (at least one required)</Label>
                <div className="space-y-2 mt-2 p-3 bg-red-50 rounded border border-red-200">
                  {[
                    "Aadhaar mismatch",
                    "PAN mismatch",
                    "Incomplete nominee details",
                    "Missing family member info",
                    "Incorrect previous employer details",
                    "Dispensary not confirmed",
                    "Other",
                  ].map((reason) => (
                    <div key={reason} className="flex items-center gap-2">
                      <Checkbox
                        checked={rejectReasons.includes(reason)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRejectReasons([...rejectReasons, reason]);
                          } else {
                            setRejectReasons(rejectReasons.filter((r) => r !== reason));
                          }
                        }}
                        id={reason}
                      />
                      <label htmlFor={reason} className="text-sm cursor-pointer">
                        {reason}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Correction Instructions (Required) *</Label>
                <Textarea
                  value={rejectInstructions}
                  onChange={(e) => setRejectInstructions(e.target.value)}
                  placeholder="Provide clear instructions for the employee to correct the issues..."
                  rows={4}
                  className="mt-2"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowRejectModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Verification Queue Verify Modal */}
      {showVerifyModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Verify Statutory Form</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowVerifyModal(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Employee:</strong> {selectedSubmission.employeeName} ({selectedSubmission.employeeId})
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Form Type:</strong> {selectedSubmission.formType}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Submitted:</strong> {new Date(selectedSubmission.submittedOn).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Verifying this form will mark it as approved and update the employee's onboarding checklist to Completed.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowVerifyModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmVerify} className="flex-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Verification
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Verification Queue Reject Modal */}
      {showRejectQueueModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reject Statutory Form</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowRejectQueueModal(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Employee:</strong> {selectedSubmission.employeeName} ({selectedSubmission.employeeId})
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Form Type:</strong> {selectedSubmission.formType}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Submitted:</strong> {new Date(selectedSubmission.submittedOn).toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide clear reason for rejection (e.g., 'Aadhaar mismatch with physical copy', 'Incomplete nominee details')..."
                  rows={4}
                  className="mt-2"
                  required
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-900">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  The employee will be notified and the onboarding checklist will be reset to allow resubmission.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowRejectQueueModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmRejectQueue} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}