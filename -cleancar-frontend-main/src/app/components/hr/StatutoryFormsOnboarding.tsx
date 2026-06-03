/**
 * Statutory Forms Onboarding - PF Form 11 & ESIC Form 1
 * Part 1: Employee-facing statutory forms in onboarding portal
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
import { toast } from "sonner";
import {
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Info,
  FileText,
  Shield,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Image,
} from "lucide-react";
import { offerLetterService } from "../../services/offerLetterService";
import { statutoryFormsService } from "../../services/statutoryFormsService";
import { onboardingChecklistService } from "../../services/onboardingChecklistService";

type FormData = {
  // PF Form 11 Fields
  pf_fullName: string;
  pf_fatherOrHusbandName: string;
  pf_dob: string;
  pf_gender: string;
  pf_maritalStatus: string;
  pf_mobile: string;
  pf_email: string;
  pf_aadhaar: string;
  pf_pan: string;
  pf_bankAccount: string;
  pf_ifsc: string;
  pf_bankName: string;
  pf_uan: string;
  pf_isFirstJob: boolean;
  pf_previousEmployer: string;
  pf_previousPFAccount: string;
  pf_previousState: string;
  pf_previousPinCode: string;
  pf_previousExitDate: string;
  pf_memberEPS: string;
  pf_memberEDLI: string;
  pf_nominees: Array<{
    name: string;
    relationship: string;
    dob: string;
    addressLine1: string;
    city: string;
    state: string;
    pinCode: string;
    sharePercentage: number;
    guardianName?: string;
    guardianRelationship?: string;
    guardianAddress?: string;
  }>;
  pf_declaration: boolean;

  // ESIC Form 1 Fields
  esic_fullName: string;
  esic_dob: string;
  esic_fatherOrHusbandName: string;
  esic_gender: string;
  esic_maritalStatus: string;
  esic_mobile: string;
  esic_aadhaar: string;
  esic_permanentAddress1: string;
  esic_permanentAddress2: string;
  esic_permanentCity: string;
  esic_permanentState: string;
  esic_permanentPinCode: string;
  esic_sameAsPermament: boolean;
  esic_localAddress1: string;
  esic_localAddress2: string;
  esic_localCity: string;
  esic_localState: string;
  esic_localPinCode: string;
  esic_dispensaryName: string;
  esic_dispensaryCity: string;
  esic_dispensaryAddress: string;
  esic_familyMembers: Array<{
    name: string;
    relationship: string;
    dob: string;
    gender: string;
    residing: string;
    aadhaar: string;
    alreadyCovered: string;
  }>;
  esic_declaration: boolean;
};

function StatutoryFormsOnboarding() {
  const [currentStep, setCurrentStep] = useState(1); // 1 = PF Form, 2 = ESIC Form
  const [employeeGrossSalary, setEmployeeGrossSalary] = useState<number>(0);
  const [employeeId, setEmployeeId] = useState<string>("TEMP-001"); // In real app, this comes from URL params or auth context

  // Toggle state for digital vs upload
  const [pfInputMode, setPfInputMode] = useState<"digital" | "upload">("digital");
  const [esicInputMode, setEsicInputMode] = useState<"digital" | "upload">("digital");

  // Uploaded file states
  const [pfUploadedFile, setPfUploadedFile] = useState<File | null>(null);
  const [esicUploadedFile, setEsicUploadedFile] = useState<File | null>(null);

  // HR Verification states for uploaded forms
  const [pfVerified, setPfVerified] = useState(false);
  const [esicVerified, setEsicVerified] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    // Pre-filled from previous onboarding steps
    pf_fullName: "Rahul Sharma",
    pf_fatherOrHusbandName: "Vijay Sharma",
    pf_dob: "1995-06-15",
    pf_gender: "Male",
    pf_maritalStatus: "Single",
    pf_mobile: "9876543210",
    pf_email: "rahul.sharma@cleancar360.com",
    pf_aadhaar: "1234 5678 9012",
    pf_pan: "ABCDE1234F",
    pf_bankAccount: "1234567890",
    pf_ifsc: "HDFC0001234",
    pf_bankName: "HDFC Bank",
    pf_uan: "",
    pf_isFirstJob: false,
    pf_previousEmployer: "",
    pf_previousPFAccount: "",
    pf_previousState: "",
    pf_previousPinCode: "",
    pf_previousExitDate: "",
    pf_memberEPS: "",
    pf_memberEDLI: "",
    pf_nominees: [
      {
        name: "",
        relationship: "",
        dob: "",
        addressLine1: "",
        city: "",
        state: "",
        pinCode: "",
        sharePercentage: 100,
      },
    ],
    pf_declaration: false,

    esic_fullName: "Rahul Sharma",
    esic_dob: "1995-06-15",
    esic_fatherOrHusbandName: "Vijay Sharma",
    esic_gender: "Male",
    esic_maritalStatus: "Single",
    esic_mobile: "9876543210",
    esic_aadhaar: "1234 5678 9012",
    esic_permanentAddress1: "123, MG Road",
    esic_permanentAddress2: "Near Central Mall",
    esic_permanentCity: "Surat",
    esic_permanentState: "Gujarat",
    esic_permanentPinCode: "395001",
    esic_sameAsPermament: true,
    esic_localAddress1: "",
    esic_localAddress2: "",
    esic_localCity: "",
    esic_localState: "",
    esic_localPinCode: "",
    esic_dispensaryName: "",
    esic_dispensaryCity: "",
    esic_dispensaryAddress: "",
    esic_familyMembers: [],
    esic_declaration: false,
  });

  // Fetch employee's gross salary from accepted offer letter
  useEffect(() => {
    const fetchEmployeeSalary = () => {
      const allOffers = offerLetterService.getAll();
      const employeeOffer = allOffers.find(
        offer => offer.employeeTempId === employeeId && offer.status === "Accepted"
      );

      if (employeeOffer) {
        setEmployeeGrossSalary(employeeOffer.salaryComponents.monthlyGross);
      } else {
        // Fallback to 18000 if no offer found (for demo purposes)
        setEmployeeGrossSalary(18000);
      }
    };

    fetchEmployeeSalary();
  }, [employeeId]);

  const isESICEligible = employeeGrossSalary < 21000;

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNomineeChange = (index: number, field: string, value: any) => {
    const updatedNominees = [...formData.pf_nominees];
    updatedNominees[index] = { ...updatedNominees[index], [field]: value };
    setFormData((prev) => ({ ...prev, pf_nominees: updatedNominees }));
  };

  const addNominee = () => {
    if (formData.pf_nominees.length < 2) {
      setFormData((prev) => ({
        ...prev,
        pf_nominees: [
          ...prev.pf_nominees,
          {
            name: "",
            relationship: "",
            dob: "",
            addressLine1: "",
            city: "",
            state: "",
            pinCode: "",
            sharePercentage: 0,
          },
        ],
      }));
    }
  };

  const removeNominee = (index: number) => {
    if (formData.pf_nominees.length > 1) {
      const updatedNominees = formData.pf_nominees.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, pf_nominees: updatedNominees }));
    }
  };

  const handleFamilyMemberChange = (index: number, field: string, value: any) => {
    const updatedMembers = [...formData.esic_familyMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFormData((prev) => ({ ...prev, esic_familyMembers: updatedMembers }));
  };

  const addFamilyMember = () => {
    if (formData.esic_familyMembers.length < 6) {
      setFormData((prev) => ({
        ...prev,
        esic_familyMembers: [
          ...prev.esic_familyMembers,
          {
            name: "",
            relationship: "",
            dob: "",
            gender: "",
            residing: "",
            aadhaar: "",
            alreadyCovered: "",
          },
        ],
      }));
    }
  };

  const removeFamilyMember = (index: number) => {
    const updatedMembers = formData.esic_familyMembers.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, esic_familyMembers: updatedMembers }));
  };

  const totalNomineeShare = formData.pf_nominees.reduce((sum, n) => sum + (n.sharePercentage || 0), 0);

  const isMinor = (dob: string) => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age < 18;
  };

  const handleSubmitPF = () => {
    // Handle upload mode
    if (pfInputMode === "upload") {
      if (!pfUploadedFile) {
        toast.error("❌ File Required\n\nPlease upload the completed PF Form 11");
        return;
      }
      if (!pfVerified) {
        toast.error("❌ Verification Required\n\nHR must verify the uploaded form before submission");
        return;
      }

      // Submit uploaded PF form to statutory service
      statutoryFormsService.submit({
        id: `PF-${employeeId}-${Date.now()}`,
        employeeId: employeeId,
        employeeName: formData.pf_fullName,
        formType: "PF Form 11",
        formData: { uploadMode: true, fileName: pfUploadedFile.name },
        submittedOn: new Date().toISOString(),
        status: "Verified",
      });

      toast.success("✅ PF Form Uploaded!\n\nHandwritten Form 11 has been verified and submitted.\nProceeding to ESIC Form 1...");
      setCurrentStep(2);
      return;
    }

    // Handle digital mode
    if (!formData.pf_declaration) {
      toast.error("❌ Declaration Required\n\nPlease accept the PF declaration to proceed");
      return;
    }
    if (totalNomineeShare !== 100) {
      toast.error(`❌ Invalid Nominee Shares\n\nTotal nominee share must equal 100%.\nCurrent total: ${totalNomineeShare}%`);
      return;
    }

    // Submit PF form to statutory service
    statutoryFormsService.submit({
      id: `PF-${employeeId}-${Date.now()}`,
      employeeId: employeeId,
      employeeName: formData.pf_fullName,
      formType: "PF Form 11",
      formData: formData,
      submittedOn: new Date().toISOString(),
      status: "Pending Verification",
    });

    toast.success("✅ PF Declaration Submitted!\n\nForm 11 has been submitted successfully.\nProceeding to ESIC Form 1...");
    setCurrentStep(2);
  };

  const handleSubmitESIC = () => {
    if (!isESICEligible) {
      // Auto-complete ESIC checklist item as "Not Applicable"
      const tasks = onboardingChecklistService.getByEmployeeId(employeeId);
      const updatedTasks = tasks.map(task =>
        task.task === "ESIC Form 1 (Statutory)"
          ? { ...task, status: "Completed" as const, completedOn: new Date().toISOString() }
          : task
      );
      onboardingChecklistService.update(employeeId, updatedTasks);

      toast.success("ESIC Form marked as Not Applicable. Your statutory forms submission is complete.");
      return;
    }

    // Handle upload mode
    if (esicInputMode === "upload") {
      if (!esicUploadedFile) {
        toast.error("❌ File Required\n\nPlease upload the completed ESIC Form 1");
        return;
      }
      if (!esicVerified) {
        toast.error("❌ Verification Required\n\nHR must verify the uploaded form before submission");
        return;
      }

      // Submit uploaded ESIC form to statutory service
      statutoryFormsService.submit({
        id: `ESIC-${employeeId}-${Date.now()}`,
        employeeId: employeeId,
        employeeName: formData.esic_fullName,
        formType: "ESIC Form 1",
        formData: { uploadMode: true, fileName: esicUploadedFile.name },
        submittedOn: new Date().toISOString(),
        status: "Verified",
      });

      toast.success(
        "✅ ESIC Form Uploaded!\n\nHandwritten Form 1 has been verified and submitted.\n\nYour statutory forms have been submitted to HR for filing."
      );
      return;
    }

    // Handle digital mode
    if (!formData.esic_declaration) {
      toast.error("❌ Declaration Required\n\nPlease accept the ESIC declaration to proceed");
      return;
    }

    // Submit ESIC form to statutory service
    statutoryFormsService.submit({
      id: `ESIC-${employeeId}-${Date.now()}`,
      employeeId: employeeId,
      employeeName: formData.esic_fullName,
      formType: "ESIC Form 1",
      formData: formData,
      submittedOn: new Date().toISOString(),
      status: "Pending Verification",
    });

    toast.success(
      "✅ ESIC Declaration Submitted!\n\nForm 1 has been submitted successfully.\n\nYour statutory forms have been submitted to HR for verification and filing."
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton label="Back" />

      {/* Progress Bar */}
      <Card className="border-teal-200 bg-teal-50">
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-teal-900">Statutory Forms Onboarding</h3>
              <p className="text-sm text-teal-700 mt-1">
                Step {currentStep} of 2 - Complete your statutory declarations
              </p>
            </div>
            <Badge className="bg-teal-600 text-white">Required for Joining</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span className="text-sm font-medium text-teal-800">PF Form 11</span>
              </div>
              <div className="w-full bg-teal-200 rounded-full h-2">
                <div
                  className={`${currentStep >= 1 ? "bg-teal-600" : "bg-teal-300"} h-2 rounded-full transition-all`}
                  style={{ width: currentStep >= 1 ? "100%" : "0%" }}
                ></div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-teal-600" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-teal-700" />
                <span className="text-sm font-medium text-teal-800">ESIC Form 1</span>
              </div>
              <div className="w-full bg-teal-200 rounded-full h-2">
                <div
                  className={`${currentStep >= 2 ? "bg-teal-600" : "bg-teal-300"} h-2 rounded-full transition-all`}
                  style={{ width: currentStep >= 2 ? "100%" : "0%" }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PF Form 11 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader className="border-b bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Provident Fund Declaration — Form 11
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Please fill all details accurately. This information will be used to register you with the Employees'
                  Provident Fund Organisation (EPFO).
                </p>
              </div>
            </div>

            {/* Toggle between digital fill and upload */}
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant={pfInputMode === "digital" ? "default" : "outline"}
                size="sm"
                onClick={() => setPfInputMode("digital")}
                className={pfInputMode === "digital" ? "bg-blue-600" : ""}
              >
                <FileText className="w-4 h-4 mr-2" />
                Fill digitally
              </Button>
              <Button
                type="button"
                variant={pfInputMode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setPfInputMode("upload")}
                className={pfInputMode === "upload" ? "bg-blue-600" : ""}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload handwritten form
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            {/* Upload Interface for PF Form */}
            {pfInputMode === "upload" && (
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Upload scanned copy or photograph of the completed PF Form 11
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Accepted formats: JPG, PNG, PDF. Maximum size: 5 MB.
                    </p>
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setPfUploadedFile(e.target.files?.[0] || null)}
                      className="max-w-md mx-auto"
                    />
                  </div>
                </div>

                {/* Preview thumbnail */}
                {pfUploadedFile && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Image className="w-10 h-10 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{pfUploadedFile.name}</p>
                          <p className="text-xs text-green-700">
                            Size: {(pfUploadedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPfUploadedFile(null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Verified by HR checkbox */}
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="pf-upload-verified"
                          checked={pfVerified}
                          onCheckedChange={(checked) => setPfVerified(checked as boolean)}
                        />
                        <Label htmlFor="pf-upload-verified" className="text-sm font-medium cursor-pointer">
                          Verified by HR — form is correctly filled and matches employee records
                        </Label>
                      </div>
                      {pfVerified && (
                        <p className="text-xs text-green-700 mt-2 ml-6">
                          ✓ Verified by HR Manager on {new Date().toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button for Upload Mode */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSubmitPF}
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={!pfUploadedFile || !pfVerified}
                  >
                    Submit PF Form (Upload)
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Digital Form Interface for PF Form */}
            {pfInputMode === "digital" && (
              <>
                {/* Personal Details */}
                <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Personal Details for PF
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={formData.pf_fullName}
                    onChange={(e) => handleChange("pf_fullName", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Father's Name / Husband's Name</Label>
                  <Input
                    value={formData.pf_fatherOrHusbandName}
                    onChange={(e) => handleChange("pf_fatherOrHusbandName", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={formData.pf_dob} onChange={(e) => handleChange("pf_dob", e.target.value)} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={formData.pf_gender} onValueChange={(val) => handleChange("pf_gender", val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Marital Status</Label>
                  <Select
                    value={formData.pf_maritalStatus}
                    onValueChange={(val) => handleChange("pf_maritalStatus", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input
                    value={formData.pf_mobile}
                    onChange={(e) => handleChange("pf_mobile", e.target.value)}
                    maxLength={10}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={formData.pf_email}
                    onChange={(e) => handleChange("pf_email", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Identity for PF */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Identity for PF</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Aadhaar Number</Label>
                  <Input value={formData.pf_aadhaar} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">
                    <Info className="w-3 h-3 inline mr-1" />
                    Linked from documents step — contact HR to update
                  </p>
                </div>
                <div>
                  <Label>PAN Number</Label>
                  <Input value={formData.pf_pan} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>Bank Account Number</Label>
                  <Input value={formData.pf_bankAccount} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>IFSC Code</Label>
                  <Input value={formData.pf_ifsc} disabled className="bg-gray-50" />
                </div>
                <div className="col-span-2">
                  <Label>Bank Name</Label>
                  <Input value={formData.pf_bankName} disabled className="bg-gray-50" />
                </div>
              </div>
            </div>

            {/* UAN Details */}
            <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-gray-900">UAN Details</h4>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.pf_isFirstJob}
                  onCheckedChange={(checked) => {
                    handleChange("pf_isFirstJob", checked);
                    if (checked) {
                      handleChange("pf_uan", "");
                      handleChange("pf_previousEmployer", "");
                      handleChange("pf_previousPFAccount", "");
                    }
                  }}
                />
                <Label className="text-sm font-normal">
                  I do not have a UAN — this is my first job
                </Label>
              </div>
              <div>
                <Label>Universal Account Number (UAN)</Label>
                <Input
                  value={formData.pf_uan}
                  onChange={(e) => handleChange("pf_uan", e.target.value)}
                  placeholder="Enter your existing UAN if you have one"
                  disabled={formData.pf_isFirstJob}
                  maxLength={12}
                  className={formData.pf_isFirstJob ? "bg-gray-100" : ""}
                />
                {formData.pf_isFirstJob && (
                  <p className="text-xs text-green-600 mt-1">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    New UAN will be assigned by EPFO
                  </p>
                )}
                {!formData.pf_isFirstJob && (
                  <p className="text-xs text-gray-500 mt-1">12-digit numeric UAN (e.g., 100123456789)</p>
                )}
              </div>

              {/* Previous Employer Details */}
              {!formData.pf_isFirstJob && formData.pf_uan && (
                <div className="space-y-4 p-4 bg-white rounded border">
                  <h5 className="font-medium text-gray-800">Previous PF Account Details</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label>Previous Employer Name</Label>
                      <Input
                        value={formData.pf_previousEmployer}
                        onChange={(e) => handleChange("pf_previousEmployer", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Previous PF Account Number</Label>
                      <Input
                        value={formData.pf_previousPFAccount}
                        onChange={(e) => handleChange("pf_previousPFAccount", e.target.value)}
                        placeholder="XX/XXX/0000000/000/0000000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: Regional / Establishment / Account</p>
                    </div>
                    <div>
                      <Label>Previous Employer State</Label>
                      <Input
                        value={formData.pf_previousState}
                        onChange={(e) => handleChange("pf_previousState", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Previous Employer PIN Code</Label>
                      <Input
                        value={formData.pf_previousPinCode}
                        onChange={(e) => handleChange("pf_previousPinCode", e.target.value)}
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <Label>Date of Exit from Previous Employer</Label>
                      <Input
                        type="date"
                        value={formData.pf_previousExitDate}
                        onChange={(e) => handleChange("pf_previousExitDate", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Member of EPS (Pension Scheme)?</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="memberEPS"
                            value="Yes"
                            checked={formData.pf_memberEPS === "Yes"}
                            onChange={(e) => handleChange("pf_memberEPS", e.target.value)}
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="memberEPS"
                            value="No"
                            checked={formData.pf_memberEPS === "No"}
                            onChange={(e) => handleChange("pf_memberEPS", e.target.value)}
                          />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label>Member of EDLI (Insurance)?</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="memberEDLI"
                            value="Yes"
                            checked={formData.pf_memberEDLI === "Yes"}
                            onChange={(e) => handleChange("pf_memberEDLI", e.target.value)}
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="memberEDLI"
                            value="No"
                            checked={formData.pf_memberEDLI === "No"}
                            onChange={(e) => handleChange("pf_memberEDLI", e.target.value)}
                          />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Nominee Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Nominee Details for PF</h4>
                <Badge
                  className={
                    totalNomineeShare === 100
                      ? "bg-green-100 text-green-800"
                      : totalNomineeShare > 100
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }
                >
                  Total Share: {totalNomineeShare}% {totalNomineeShare === 100 ? "✓" : "— must equal 100%"}
                </Badge>
              </div>

              {formData.pf_nominees.map((nominee, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-800">Nominee {index + 1}</h5>
                    {formData.pf_nominees.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNominee(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label>Full Name of Nominee *</Label>
                      <Input
                        value={nominee.name}
                        onChange={(e) => handleNomineeChange(index, "name", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Relationship with Nominee *</Label>
                      <Select
                        value={nominee.relationship}
                        onValueChange={(val) => handleNomineeChange(index, "relationship", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Spouse">Spouse</SelectItem>
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Son">Son</SelectItem>
                          <SelectItem value="Daughter">Daughter</SelectItem>
                          <SelectItem value="Brother">Brother</SelectItem>
                          <SelectItem value="Sister">Sister</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date of Birth of Nominee *</Label>
                      <Input
                        type="date"
                        value={nominee.dob}
                        onChange={(e) => handleNomineeChange(index, "dob", e.target.value)}
                      />
                      {nominee.dob && isMinor(nominee.dob) && (
                        <p className="text-xs text-amber-600 mt-1">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Minor — Guardian details required
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Share Percentage *</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={nominee.sharePercentage}
                        onChange={(e) => handleNomineeChange(index, "sharePercentage", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Address Line 1 *</Label>
                      <Input
                        value={nominee.addressLine1}
                        onChange={(e) => handleNomineeChange(index, "addressLine1", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>City *</Label>
                      <Input
                        value={nominee.city}
                        onChange={(e) => handleNomineeChange(index, "city", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Input
                        value={nominee.state}
                        onChange={(e) => handleNomineeChange(index, "state", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>PIN Code *</Label>
                      <Input
                        value={nominee.pinCode}
                        onChange={(e) => handleNomineeChange(index, "pinCode", e.target.value)}
                        maxLength={6}
                      />
                    </div>
                  </div>

                  {/* Guardian Details for Minor */}
                  {nominee.dob && isMinor(nominee.dob) && (
                    <div className="p-3 bg-amber-50 rounded border border-amber-200 space-y-3">
                      <h6 className="font-medium text-amber-900 text-sm">Guardian Details (Nominee is a minor)</h6>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Guardian Name</Label>
                          <Input
                            value={nominee.guardianName || ""}
                            onChange={(e) => handleNomineeChange(index, "guardianName", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Guardian Relationship</Label>
                          <Input
                            value={nominee.guardianRelationship || ""}
                            onChange={(e) => handleNomineeChange(index, "guardianRelationship", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm">Guardian Address</Label>
                          <Input
                            value={nominee.guardianAddress || ""}
                            onChange={(e) => handleNomineeChange(index, "guardianAddress", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {formData.pf_nominees.length < 2 && (
                <Button variant="outline" onClick={addNominee} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Nominee (Max 2)
                </Button>
              )}
            </div>

            {/* Declaration */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={formData.pf_declaration}
                  onCheckedChange={(checked) => handleChange("pf_declaration", checked as boolean)}
                  id="pf-declaration"
                />
                <label htmlFor="pf-declaration" className="text-sm text-gray-700 cursor-pointer">
                  I hereby declare that the information furnished above is true and correct to the best of my knowledge.
                  I understand that furnishing false information is a punishable offence.
                </label>
              </div>
            </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button onClick={handleSubmitPF} className="bg-teal-600 hover:bg-teal-700">
                    Submit PF Declaration
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ESIC Form 1 */}
      {currentStep === 2 && (
        <Card>
          <CardHeader className="border-b bg-teal-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  Employees' State Insurance Declaration — Form 1
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  ESIC provides medical and cash benefits. Fill all family member details carefully to ensure correct
                  coverage.
                </p>
              </div>
            </div>

            {/* Toggle between digital fill and upload */}
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant={esicInputMode === "digital" ? "default" : "outline"}
                size="sm"
                onClick={() => setEsicInputMode("digital")}
                className={esicInputMode === "digital" ? "bg-teal-600" : ""}
              >
                <FileText className="w-4 h-4 mr-2" />
                Fill digitally
              </Button>
              <Button
                type="button"
                variant={esicInputMode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setEsicInputMode("upload")}
                className={esicInputMode === "upload" ? "bg-teal-600" : ""}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload handwritten form
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            {/* Upload Interface for ESIC Form */}
            {esicInputMode === "upload" && (
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed border-teal-300 rounded-lg bg-teal-50">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Upload scanned copy or photograph of the completed ESIC Form 1
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Accepted formats: JPG, PNG, PDF. Maximum size: 5 MB.
                    </p>
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setEsicUploadedFile(e.target.files?.[0] || null)}
                      className="max-w-md mx-auto"
                    />
                  </div>
                </div>

                {/* Preview thumbnail */}
                {esicUploadedFile && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Image className="w-10 h-10 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{esicUploadedFile.name}</p>
                          <p className="text-xs text-green-700">
                            Size: {(esicUploadedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEsicUploadedFile(null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Verified by HR checkbox */}
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="esic-upload-verified"
                          checked={esicVerified}
                          onCheckedChange={(checked) => setEsicVerified(checked as boolean)}
                        />
                        <Label htmlFor="esic-upload-verified" className="text-sm font-medium cursor-pointer">
                          Verified by HR — form is correctly filled and matches employee records
                        </Label>
                      </div>
                      {esicVerified && (
                        <p className="text-xs text-green-700 mt-2 ml-6">
                          ✓ Verified by HR Manager on {new Date().toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Buttons for Upload Mode */}
                <div className="flex justify-between gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to PF Form
                  </Button>
                  {isESICEligible ? (
                    <Button
                      onClick={handleSubmitESIC}
                      className="bg-teal-600 hover:bg-teal-700"
                      disabled={!esicUploadedFile || !esicVerified}
                    >
                      Submit ESIC Form (Upload)
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitESIC}
                      className="bg-gray-400 hover:bg-gray-500 text-white cursor-default"
                    >
                      Not Applicable
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Digital Form Interface for ESIC Form */}
            {esicInputMode === "digital" && (
              <>
                {/* Eligibility Banner */}
                <div
                  className={`p-4 rounded-lg border ${
                    isESICEligible
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}
                >
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {isESICEligible ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600" />
                )}
                <div>
                  {isESICEligible ? (
                    <>
                      <p className="font-semibold">You are eligible for ESIC coverage.</p>
                      <p className="text-sm mt-1">Please complete this declaration.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">
                        This employee earns ₹{employeeGrossSalary.toLocaleString("en-IN")}/month — ESIC registration is not applicable.
                      </p>
                      <p className="text-sm mt-1">ESIC Form 1 is not required.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Employee Details for ESIC */}
            <div className={`space-y-4 ${!isESICEligible ? "opacity-50 pointer-events-none" : ""}`}>
              <h4 className="font-semibold text-gray-900">Employee Details for ESIC</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={formData.esic_fullName}
                    onChange={(e) => handleChange("esic_fullName", e.target.value)}
                    disabled={!isESICEligible}
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.esic_dob}
                    onChange={(e) => handleChange("esic_dob", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Father's Name / Husband's Name</Label>
                  <Input
                    value={formData.esic_fatherOrHusbandName}
                    onChange={(e) => handleChange("esic_fatherOrHusbandName", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Input value={formData.esic_gender} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>Marital Status</Label>
                  <Input value={formData.esic_maritalStatus} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input
                    value={formData.esic_mobile}
                    onChange={(e) => handleChange("esic_mobile", e.target.value)}
                    maxLength={10}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Aadhaar Number</Label>
                  <Input value={formData.esic_aadhaar} disabled className="bg-gray-50" />
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div className={`space-y-4 ${!isESICEligible ? "opacity-50 pointer-events-none" : ""}`}>
              <h4 className="font-semibold text-gray-900">Permanent Address</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={formData.esic_permanentAddress1}
                    onChange={(e) => handleChange("esic_permanentAddress1", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address Line 2</Label>
                  <Input
                    value={formData.esic_permanentAddress2}
                    onChange={(e) => handleChange("esic_permanentAddress2", e.target.value)}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.esic_permanentCity}
                    onChange={(e) => handleChange("esic_permanentCity", e.target.value)}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.esic_permanentState}
                    onChange={(e) => handleChange("esic_permanentState", e.target.value)}
                  />
                </div>
                <div>
                  <Label>PIN Code</Label>
                  <Input
                    value={formData.esic_permanentPinCode}
                    onChange={(e) => handleChange("esic_permanentPinCode", e.target.value)}
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Local Address */}
              <div className="flex items-center gap-2 mt-4">
                <Checkbox
                  checked={formData.esic_sameAsPermament}
                  onCheckedChange={(checked) => handleChange("esic_sameAsPermament", checked)}
                />
                <Label className="font-normal">Local address same as permanent address</Label>
              </div>

              {!formData.esic_sameAsPermament && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded border">
                  <h5 className="col-span-2 font-medium text-gray-800">Local Address</h5>
                  <div className="col-span-2">
                    <Label>Address Line 1</Label>
                    <Input
                      value={formData.esic_localAddress1}
                      onChange={(e) => handleChange("esic_localAddress1", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Address Line 2</Label>
                    <Input
                      value={formData.esic_localAddress2}
                      onChange={(e) => handleChange("esic_localAddress2", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.esic_localCity}
                      onChange={(e) => handleChange("esic_localCity", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={formData.esic_localState}
                      onChange={(e) => handleChange("esic_localState", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>PIN Code</Label>
                    <Input
                      value={formData.esic_localPinCode}
                      onChange={(e) => handleChange("esic_localPinCode", e.target.value)}
                      maxLength={6}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dispensary Preference */}
            <div className={`space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200 ${!isESICEligible ? "opacity-50 pointer-events-none" : ""}`}>
              <h4 className="font-semibold text-gray-900">Dispensary / Hospital Preference</h4>
              <p className="text-sm text-blue-700">
                <Info className="w-4 h-4 inline mr-1" />
                You and your family will receive medical treatment at this dispensary. Choose the one nearest to your
                residence.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-2">
                  <Label>Preferred ESIC Dispensary Name</Label>
                  <Input
                    value={formData.esic_dispensaryName}
                    onChange={(e) => handleChange("esic_dispensaryName", e.target.value)}
                    placeholder="Enter nearest ESIC dispensary or hospital name"
                  />
                </div>
                <div>
                  <Label>Dispensary City</Label>
                  <Input
                    value={formData.esic_dispensaryCity}
                    onChange={(e) => handleChange("esic_dispensaryCity", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Dispensary Address</Label>
                  <Textarea
                    value={formData.esic_dispensaryAddress}
                    onChange={(e) => handleChange("esic_dispensaryAddress", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Family Members */}
            <div className={`space-y-4 ${!isESICEligible ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Family Members for ESIC Coverage</h4>
                <Badge variant="outline">{formData.esic_familyMembers.length} / 6 members</Badge>
              </div>
              <p className="text-sm text-gray-600">
                <Info className="w-4 h-4 inline mr-1" />
                You may add up to 6 family members. Dependent parents must be residing with you and not earning above
                the prescribed limit.
              </p>

              {formData.esic_familyMembers.map((member, index) => (
                <div key={index} className="p-4 bg-teal-50 rounded-lg border border-teal-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-teal-900">Family Member {index + 1}</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFamilyMember(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label>Full Name *</Label>
                      <Input
                        value={member.name}
                        onChange={(e) => handleFamilyMemberChange(index, "name", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Relationship *</Label>
                      <Select
                        value={member.relationship}
                        onValueChange={(val) => handleFamilyMemberChange(index, "relationship", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Spouse">Spouse</SelectItem>
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Son">Son</SelectItem>
                          <SelectItem value="Daughter">Daughter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date of Birth *</Label>
                      <Input
                        type="date"
                        value={member.dob}
                        onChange={(e) => handleFamilyMemberChange(index, "dob", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Gender *</Label>
                      <Select
                        value={member.gender}
                        onValueChange={(val) => handleFamilyMemberChange(index, "gender", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Residing with employee? *</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`residing-${index}`}
                            value="Yes"
                            checked={member.residing === "Yes"}
                            onChange={(e) => handleFamilyMemberChange(index, "residing", e.target.value)}
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`residing-${index}`}
                            value="No"
                            checked={member.residing === "No"}
                            onChange={(e) => handleFamilyMemberChange(index, "residing", e.target.value)}
                          />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                      {member.residing === "No" && (
                        <p className="text-xs text-amber-600 mt-1">
                          Non-residing dependants may require additional documentation
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Aadhaar Number (Optional)</Label>
                      <Input
                        value={member.aadhaar}
                        onChange={(e) => handleFamilyMemberChange(index, "aadhaar", e.target.value)}
                        placeholder="XXXX XXXX XXXX"
                        maxLength={14}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Already covered under ESI? *</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`covered-${index}`}
                            value="Yes"
                            checked={member.alreadyCovered === "Yes"}
                            onChange={(e) => handleFamilyMemberChange(index, "alreadyCovered", e.target.value)}
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`covered-${index}`}
                            value="No"
                            checked={member.alreadyCovered === "No"}
                            onChange={(e) => handleFamilyMemberChange(index, "alreadyCovered", e.target.value)}
                          />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                      {member.alreadyCovered === "Yes" && (
                        <p className="text-xs text-red-600 mt-1">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Member already covered under ESI may not be eligible for duplicate coverage
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {formData.esic_familyMembers.length < 6 && (
                <Button variant="outline" onClick={addFamilyMember} className="w-full border-teal-300 text-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Family Member (Max 6)
                </Button>
              )}
            </div>

            {/* Declaration */}
            <div className={`p-4 bg-teal-50 rounded-lg border border-teal-200 ${!isESICEligible ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={formData.esic_declaration}
                  onCheckedChange={(checked) => handleChange("esic_declaration", checked as boolean)}
                  id="esic-declaration"
                  disabled={!isESICEligible}
                />
                <label htmlFor="esic-declaration" className="text-sm text-gray-700 cursor-pointer">
                  I hereby declare that all particulars given above are correct and complete. I am aware that if any
                  information is found to be false, I will be liable for legal action under the ESI Act 1948.
                </label>
              </div>
            </div>

                {/* Submit Buttons */}
                <div className="flex justify-between gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to PF Form
                  </Button>
                  {isESICEligible ? (
                    <Button onClick={handleSubmitESIC} className="bg-teal-600 hover:bg-teal-700">
                      Submit ESIC Declaration
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitESIC}
                      className="bg-gray-400 hover:bg-gray-500 text-white cursor-default"
                    >
                      Not Applicable
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StatutoryFormsOnboarding;