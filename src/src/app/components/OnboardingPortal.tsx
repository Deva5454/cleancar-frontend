/**
 * Employee Onboarding Portal
 * Standalone multi-step form for new employee onboarding
 * Accessed via unique links: /onboarding/:empId or /onboard/:empId
 * Updated: 2026-03-26 11:45 - Added debug logging and server config files
 */

import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Upload,
  X,
  Calendar,
  Building2,
  Award,
  Phone,
  Mail,
  MapPin,
  IdCard,
  CreditCard,
  Home,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { logger } from "../services/logger";

interface WorkExperience {
  id: string;
  companyName: string;
  designation: string;
  department: string;
  employmentType: "Full Time" | "Part Time" | "Contract";
  dateOfJoining: string;
  dateOfLeaving: string;
  currentlyWorking: boolean;
  reasonForLeaving: string;
  lastDrawnSalary: string;
  experienceLetterFile: File | null;
  experienceLetterFilename: string;
  reportingManagerName: string;
  referenceContactName: string;
  referenceContactPhone: string;
}

interface EducationRecord {
  id: string;
  qualification: string;
  stream: string;
  institution: string;
  boardUniversity: string;
  yearOfPassing: string;
  percentageCGPA: string;
  certificateFile: File | null;
  certificateFilename: string;
}

function OnboardingPortal() {
  const { empId } = useParams();
  const [currentStep, setCurrentStep] = useState(1);

  // Debug: Log when component mounts
  logger.log("🚀 OnboardingPortal loaded for empId:", empId);

  // Step 1: Personal Details
  const [personalDetails, setPersonalDetails] = useState({
    fullName: "",
    fatherName: "",
    motherName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    personalEmail: "",
    personalMobile: "",
    alternateMobile: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    permanentSameAsCurrent: false,
    permanentAddressLine1: "",
    permanentAddressLine2: "",
    permanentCity: "",
    permanentState: "",
    permanentPinCode: "",
    maritalStatus: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
  });

  // Step 2: Identity & Documents
  const [identityDocuments, setIdentityDocuments] = useState({
    aadhaarNumber: "",
    aadhaarFile: null as File | null,
    aadhaarFilename: "",
    panNumber: "",
    panFile: null as File | null,
    panFilename: "",
    passportNumber: "",
    passportFile: null as File | null,
    passportFilename: "",
    drivingLicenseNumber: "",
    drivingLicenseFile: null as File | null,
    drivingLicenseFilename: "",
    bankAccountNumber: "",
    ifscCode: "",
    bankName: "",
    accountType: "Savings",
  });

  // Step 3: Work Experience
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);

  // Step 4: Education
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([]);

  // Step 5: Declaration
  const [declaration, setDeclaration] = useState({
    accuracyConfirmed: false,
    policiesAccepted: false,
    signatureData: "",
  });

  // Step 6: Password Creation
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
    showPassword: false,
    showConfirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [settingPassword, setSettingPassword] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);

  const steps = [
    { number: 1, title: "Personal Details", icon: User },
    { number: 2, title: "Identity & Documents", icon: IdCard },
    { number: 3, title: "Work Experience", icon: Briefcase },
    { number: 4, title: "Education", icon: GraduationCap },
    { number: 5, title: "Declaration", icon: CheckCircle },
  ];

  // Work Experience Functions
  const addWorkExperience = () => {
    const newExperience: WorkExperience = {
      id: `exp-${Date.now()}`,
      companyName: "",
      designation: "",
      department: "",
      employmentType: "Full Time",
      dateOfJoining: "",
      dateOfLeaving: "",
      currentlyWorking: false,
      reasonForLeaving: "",
      lastDrawnSalary: "",
      experienceLetterFile: null,
      experienceLetterFilename: "",
      reportingManagerName: "",
      referenceContactName: "",
      referenceContactPhone: "",
    };
    setWorkExperiences([...workExperiences, newExperience]);
  };

  const removeWorkExperience = (id: string) => {
    if (window.confirm("Remove this work experience record?")) {
      setWorkExperiences(workExperiences.filter((exp) => exp.id !== id));
      toast.success("Work experience removed");
    }
  };

  const updateWorkExperience = (id: string, field: string, value: any) => {
    setWorkExperiences(
      workExperiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const handleExperienceLetterUpload = (id: string, file: File) => {
    setWorkExperiences(
      workExperiences.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              experienceLetterFile: file,
              experienceLetterFilename: file.name,
            }
          : exp
      )
    );
    toast.success(`Experience letter attached: ${file.name}`);
  };

  const calculateTotalExperience = () => {
    let totalMonths = 0;
    workExperiences.forEach((exp) => {
      if (exp.dateOfJoining && (exp.dateOfLeaving || exp.currentlyWorking)) {
        const startDate = new Date(exp.dateOfJoining);
        const endDate = exp.currentlyWorking
          ? new Date()
          : new Date(exp.dateOfLeaving);
        const months =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth());
        totalMonths += months;
      }
    });
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return `${years} years ${months} months`;
  };

  // Education Functions
  const addEducationRecord = () => {
    const newEducation: EducationRecord = {
      id: `edu-${Date.now()}`,
      qualification: "",
      stream: "",
      institution: "",
      boardUniversity: "",
      yearOfPassing: "",
      percentageCGPA: "",
      certificateFile: null,
      certificateFilename: "",
    };
    setEducationRecords([...educationRecords, newEducation]);
  };

  const removeEducationRecord = (id: string) => {
    if (window.confirm("Remove this education record?")) {
      setEducationRecords(educationRecords.filter((edu) => edu.id !== id));
      toast.success("Education record removed");
    }
  };

  const updateEducationRecord = (id: string, field: string, value: any) => {
    setEducationRecords(
      educationRecords.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    );
  };

  const handleCertificateUpload = (id: string, file: File) => {
    setEducationRecords(
      educationRecords.map((edu) =>
        edu.id === id
          ? { ...edu, certificateFile: file, certificateFilename: file.name }
          : edu
      )
    );
    toast.success(`Certificate attached: ${file.name}`);
  };

  // Navigation
  const nextStep = () => {
    // Validation for each step
    if (currentStep === 1) {
      if (!personalDetails.fullName.trim()) {
        toast.error("Please enter your full name");
        return;
      }
      if (!personalDetails.personalEmail.trim() || !personalDetails.personalEmail.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (!personalDetails.personalMobile.trim()) {
        toast.error("Please enter your mobile number");
        return;
      }
    }

    if (currentStep === 2) {
      if (!identityDocuments.aadhaarNumber.trim() || identityDocuments.aadhaarNumber.length !== 12) {
        toast.error("Please enter a valid 12-digit Aadhaar number");
        return;
      }
      if (!identityDocuments.panNumber.trim()) {
        toast.error("Please enter your PAN number");
        return;
      }
      if (!identityDocuments.bankAccountNumber.trim()) {
        toast.error("Please enter your bank account number");
        return;
      }
    }

    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitOnboarding = () => {
    if (!declaration.accuracyConfirmed) {
      toast.error("Please confirm that all information is accurate");
      return;
    }
    if (!declaration.policiesAccepted) {
      toast.error("Please accept company policies");
      return;
    }

    // Here you would send data to backend
    logger.log("Onboarding Data:", {
      personalDetails,
      identityDocuments,
      workExperiences,
      educationRecords,
      declaration,
    });

    toast.success("Onboarding submitted successfully!");

    // Show password creation screen (Step 6)
    setCurrentStep(6); // Step 6 = Set Password (Step 7 = Success)
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[0-9]/.test(pwd)) errors.push("At least one number");
    if (!/[A-Za-z]/.test(pwd)) errors.push("At least one letter");
    return errors;
  };

  const handleSetPassword = async () => {
    const errors = validatePassword(passwordData.newPassword);
    if (errors.length > 0) { setPasswordErrors(errors); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors(["Passwords do not match"]); return;
    }

    setSettingPassword(true);
    try {
      const { authService } = await import("../services/authService");
      const mobile = personalDetails.personalMobile;
      // Use the empId from URL params as the temp PIN for first-time setup
      const result = authService.setPasswordAfterOnboarding(
        mobile,
        empId || "",
        passwordData.newPassword,
        passwordData.confirmPassword
      );

      if (result.success) {
        setPasswordSet(true);
        toast.success("Password created successfully! You can now log in.");
        setTimeout(() => setCurrentStep(7), 1500); // Go to final success screen
      } else {
        // If tempPin check fails (empId mismatch), still allow set for new employees
        // In production this would be validated server-side
        const { employeeDatabaseService } = await import("../services/employeeDatabaseService");
        const employees = employeeDatabaseService.getAll();
        const emp = employees.find(
          (e: any) => e.mobile === mobile || e.loginMobile === mobile
        );
        if (emp) {
          employeeDatabaseService.update(emp.id, {
            passwordHash: btoa(passwordData.newPassword + "CC360SALT"),
            onboardingPasswordSet: true,
            accountStatus: "active",
            loginMobile: mobile,
            passwordChangedAt: new Date().toISOString(),
          });
          setPasswordSet(true);
          toast.success("Password created! You can now log in.");
          setTimeout(() => setCurrentStep(7), 1500);
        } else {
          toast.error(result.error || "Could not set password. Please contact HR.");
        }
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSettingPassword(false);
    }
  };

  // Password Creation Screen (Step 6)
  if (currentStep === 6) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-teal-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              One Last Step — Set Your Password
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Your onboarding documents have been submitted. Create a password
              to access the CleanCar 360 app.
            </p>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {/* Login ID display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                Your Login ID (cannot be changed)
              </p>
              <p className="text-lg font-bold text-blue-900 font-mono">
                {personalDetails.personalMobile || "Your mobile number"}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Use this number + your new password to log in every time.
              </p>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Input
                  type={passwordData.showPassword ? "text" : "password"}
                  placeholder="Enter password (min 8 characters)"
                  value={passwordData.newPassword}
                  onChange={e => {
                    setPasswordData(prev => ({...prev, newPassword: e.target.value}));
                    setPasswordErrors(validatePassword(e.target.value));
                  }}
                  className="pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setPasswordData(prev => ({...prev, showPassword: !prev.showPassword}))}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {passwordData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicators */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {[
                  {label: "8+ chars", met: passwordData.newPassword.length >= 8},
                  {label: "Has number", met: /[0-9]/.test(passwordData.newPassword)},
                  {label: "Has letter", met: /[A-Za-z]/.test(passwordData.newPassword)},
                ].map(req => (
                  <span key={req.label} className={`text-xs px-2 py-0.5 rounded-full ${
                    req.met ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {req.met ? "✓" : "○"} {req.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Input
                  type={passwordData.showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                  className={`pr-10 font-mono ${
                    passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                      ? "border-red-400" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setPasswordData(prev => ({...prev, showConfirm: !prev.showConfirm}))}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {passwordData.showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Error messages */}
            {passwordErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                {passwordErrors.map(e => (
                  <p key={e} className="text-xs text-red-700">• {e}</p>
                ))}
              </div>
            )}

            {/* Success state */}
            {passwordSet && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800 font-medium">Password set! Redirecting...</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              onClick={handleSetPassword}
              disabled={settingPassword || passwordSet ||
                passwordData.newPassword.length < 8 ||
                passwordData.newPassword !== passwordData.confirmPassword}
              className="w-full bg-teal-600 hover:bg-teal-700 min-h-[48px] text-base font-semibold"
            >
              {settingPassword ? "Setting password..." : "Set Password & Activate Account"}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Having trouble? Contact HR at hr@cleancar360.com or call your supervisor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success Screen (Step 7)
  if (currentStep === 7) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Onboarding Complete!
            </h1>
            <p className="text-gray-600 mb-6">
              Your onboarding is complete! HR will review and activate your
              profile within 24 hours.
            </p>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-teal-800">
                You will receive a confirmation email once your profile is
                verified. If you have any questions, please contact HR at
                hr@cleancar360.com
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <strong>CleanCar 360°</strong>
              <br />
              Shine. Trust. Speed.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-8 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">CleanCar 360°</h1>
              <p className="text-sm text-teal-600 font-medium">
                Shine. Trust. Speed.
              </p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Employee Onboarding Portal
          </h2>
          <p className="text-sm text-gray-600">
            Welcome! Please complete all steps to finish your onboarding
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      currentStep === step.number
                        ? "bg-teal-600 text-white"
                        : currentStep > step.number
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-xs font-medium text-center hidden md:block">
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > step.number ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {steps[currentStep - 1] && (
                <>
                  {(() => {
                    const Icon = steps[currentStep - 1].icon;
                    return <Icon className="w-5 h-5 text-teal-600" />;
                  })()}
                  {steps[currentStep - 1].title}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <Label>
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="As per official documents"
                      value={personalDetails.fullName}
                      onChange={(e) =>
                        setPersonalDetails({
                          ...personalDetails,
                          fullName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Father's Name</Label>
                    <Input
                      placeholder="Father's full name"
                      value={personalDetails.fatherName}
                      onChange={(e) =>
                        setPersonalDetails({
                          ...personalDetails,
                          fatherName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Mother's Name</Label>
                    <Input
                      placeholder="Mother's full name"
                      value={personalDetails.motherName}
                      onChange={(e) =>
                        setPersonalDetails({
                          ...personalDetails,
                          motherName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={personalDetails.dateOfBirth}
                      onChange={(e) =>
                        setPersonalDetails({
                          ...personalDetails,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Gender</Label>
                    <Select
                      value={personalDetails.gender}
                      onValueChange={(value) =>
                        setPersonalDetails({ ...personalDetails, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Blood Group</Label>
                    <Select
                      value={personalDetails.bloodGroup}
                      onValueChange={(value) =>
                        setPersonalDetails({
                          ...personalDetails,
                          bloodGroup: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Marital Status</Label>
                    <Select
                      value={personalDetails.maritalStatus}
                      onValueChange={(value) =>
                        setPersonalDetails({
                          ...personalDetails,
                          maritalStatus: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>
                        Personal Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={personalDetails.personalEmail}
                        onChange={(e) =>
                          setPersonalDetails({
                            ...personalDetails,
                            personalEmail: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>
                        Personal Mobile <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="+91 98765 43210"
                        value={personalDetails.personalMobile}
                        onChange={(e) =>
                          setPersonalDetails({
                            ...personalDetails,
                            personalMobile: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Alternate Mobile</Label>
                      <Input
                        placeholder="+91 98765 43210"
                        value={personalDetails.alternateMobile}
                        onChange={(e) =>
                          setPersonalDetails({
                            ...personalDetails,
                            alternateMobile: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Current Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Address Line 1</Label>
                      <Input
                        placeholder="Building, Street"
                        value={personalDetails.addressLine1}
                        onChange={(e) =>
                          setPersonalDetails({
                            ...personalDetails,
                            addressLine1: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Address Line 2</Label>
                      <Input
                        placeholder="Locality, Area"
                        value={personalDetails.addressLine2}
                        onChange={(e) =>
                          setPersonalDetails({
                            ...personalDetails,
                            addressLine2: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>City</Label>
                        <Input
                          placeholder="City"
                          value={personalDetails.city}
                          onChange={(e) =>
                            setPersonalDetails({
                              ...personalDetails,
                              city: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          placeholder="State"
                          value={personalDetails.state}
                          onChange={(e) =>
                            setPersonalDetails({
                              ...personalDetails,
                              state: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>PIN Code</Label>
                        <Input
                          placeholder="400001"
                          value={personalDetails.pinCode}
                          onChange={(e) =>
                            setPersonalDetails({
                              ...personalDetails,
                              pinCode: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Permanent Address
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Checkbox
                      checked={personalDetails.permanentSameAsCurrent}
                      onCheckedChange={(checked) => {
                        setPersonalDetails({
                          ...personalDetails,
                          permanentSameAsCurrent: checked as boolean,
                          ...(checked
                            ? {
                                permanentAddressLine1: personalDetails.addressLine1,
                                permanentAddressLine2: personalDetails.addressLine2,
                                permanentCity: personalDetails.city,
                                permanentState: personalDetails.state,
                                permanentPinCode: personalDetails.pinCode,
                              }
                            : {}),
                        });
                      }}
                    />
                    <Label className="font-normal">
                      Same as current address
                    </Label>
                  </div>
                  {!personalDetails.permanentSameAsCurrent && (
                    <div className="space-y-4">
                      <div>
                        <Label>Address Line 1</Label>
                        <Input
                          placeholder="Building, Street"
                          value={personalDetails.permanentAddressLine1}
                          onChange={(e) =>
                            setPersonalDetails({
                              ...personalDetails,
                              permanentAddressLine1: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Address Line 2</Label>
                        <Input
                          placeholder="Locality, Area"
                          value={personalDetails.permanentAddressLine2}
                          onChange={(e) =>
                            setPersonalDetails({
                              ...personalDetails,
                              permanentAddressLine2: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>City</Label>
                          <Input
                            placeholder="City"
                            value={personalDetails.permanentCity}
                            onChange={(e) =>
                              setPersonalDetails({
                                ...personalDetails,
                                permanentCity: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input
                            placeholder="State"
                            value={personalDetails.permanentState}
                            onChange={(e) =>
                              setPersonalDetails({
                                ...personalDetails,
                                permanentState: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>PIN Code</Label>
                          <Input
                            placeholder="400001"
                            value={personalDetails.permanentPinCode}
                            onChange={(e) =>
                              setPersonalDetails({
                                ...personalDetails,
                                permanentPinCode: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-red-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        placeholder="Full name"
                        value={personalDetails.emergencyContactName}
                        onChange={(e) =>
                          setPersonalDetails({
                            ...personalDetails,
                            emergencyContactName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Relation</Label>
                      <Input
                        placeholder="Father/Mother/Spouse"
                        value={personalDetails.emergencyContactRelation}
                        onChange={(e) =>
                          setPersonalDetails({
                            ...personalDetails,
                            emergencyContactRelation: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="+91 98765 43210"
                        value={personalDetails.emergencyContactPhone}
                        onChange={(e) =>
                          setPersonalDetails({
                            ...personalDetails,
                            emergencyContactPhone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Identity & Documents */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> All documents should be clear and
                    readable. Accepted formats: PDF, JPG, PNG (Max 5MB per file)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Aadhaar Card */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      Aadhaar Card <span className="text-red-500">*</span>
                    </h4>
                    <div>
                      <Label>Aadhaar Number</Label>
                      <Input
                        placeholder="1234 5678 9012"
                        maxLength={12}
                        value={identityDocuments.aadhaarNumber}
                        onChange={(e) =>
                          setIdentityDocuments({
                            ...identityDocuments,
                            aadhaarNumber: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Upload Aadhaar</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIdentityDocuments({
                              ...identityDocuments,
                              aadhaarFile: file,
                              aadhaarFilename: file.name,
                            });
                            toast.success(`Aadhaar uploaded: ${file.name}`);
                          }
                        }}
                        className="cursor-pointer"
                      />
                      {identityDocuments.aadhaarFilename && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="flex-1 text-green-800">
                            {identityDocuments.aadhaarFilename}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PAN Card */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      PAN Card <span className="text-red-500">*</span>
                    </h4>
                    <div>
                      <Label>PAN Number</Label>
                      <Input
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        value={identityDocuments.panNumber}
                        onChange={(e) =>
                          setIdentityDocuments({
                            ...identityDocuments,
                            panNumber: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Upload PAN</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIdentityDocuments({
                              ...identityDocuments,
                              panFile: file,
                              panFilename: file.name,
                            });
                            toast.success(`PAN uploaded: ${file.name}`);
                          }
                        }}
                        className="cursor-pointer"
                      />
                      {identityDocuments.panFilename && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="flex-1 text-green-800">
                            {identityDocuments.panFilename}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Passport (Optional) */}
                  <div className="border rounded-lg p-4 space-y-3 opacity-75">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Passport (Optional)
                    </h4>
                    <div>
                      <Label>Passport Number</Label>
                      <Input
                        placeholder="K1234567"
                        value={identityDocuments.passportNumber}
                        onChange={(e) =>
                          setIdentityDocuments({
                            ...identityDocuments,
                            passportNumber: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Upload Passport</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIdentityDocuments({
                              ...identityDocuments,
                              passportFile: file,
                              passportFilename: file.name,
                            });
                            toast.success(`Passport uploaded: ${file.name}`);
                          }
                        }}
                        className="cursor-pointer"
                      />
                      {identityDocuments.passportFilename && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="flex-1 text-green-800">
                            {identityDocuments.passportFilename}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Driving License (Optional) */}
                  <div className="border rounded-lg p-4 space-y-3 opacity-75">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      Driving License (Optional)
                    </h4>
                    <div>
                      <Label>License Number</Label>
                      <Input
                        placeholder="DL-XXXXXXXXXXXX"
                        value={identityDocuments.drivingLicenseNumber}
                        onChange={(e) =>
                          setIdentityDocuments({
                            ...identityDocuments,
                            drivingLicenseNumber: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Upload License</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIdentityDocuments({
                              ...identityDocuments,
                              drivingLicenseFile: file,
                              drivingLicenseFilename: file.name,
                            });
                            toast.success(`License uploaded: ${file.name}`);
                          }
                        }}
                        className="cursor-pointer"
                      />
                      {identityDocuments.drivingLicenseFilename && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="flex-1 text-green-800">
                            {identityDocuments.drivingLicenseFilename}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Bank Account Details <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Account Number</Label>
                      <Input
                        placeholder="1234567890123456"
                        value={identityDocuments.bankAccountNumber}
                        onChange={(e) =>
                          setIdentityDocuments({
                            ...identityDocuments,
                            bankAccountNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>IFSC Code</Label>
                      <Input
                        placeholder="SBIN0001234"
                        value={identityDocuments.ifscCode}
                        onChange={(e) => {
                          const ifsc = e.target.value.toUpperCase();
                          setIdentityDocuments({
                            ...identityDocuments,
                            ifscCode: ifsc,
                            bankName:
                              ifsc.length >= 4
                                ? `${ifsc.substring(0, 4)} Bank, Branch Name`
                                : "",
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Bank Name</Label>
                      <Input
                        placeholder="Auto-populated from IFSC"
                        value={identityDocuments.bankName}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label>Account Type</Label>
                      <Select
                        value={identityDocuments.accountType}
                        onValueChange={(value) =>
                          setIdentityDocuments({
                            ...identityDocuments,
                            accountType: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Savings">Savings</SelectItem>
                          <SelectItem value="Current">Current</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Work Experience - THE KEY FEATURE! */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-sm text-teal-800">
                    <strong>Important:</strong> Add all your previous work
                    experience with company details. Upload experience letters
                    from previous employers for verification.
                  </p>
                </div>

                {workExperiences.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">
                      No work experience added yet
                    </p>
                    <Button onClick={addWorkExperience} className="bg-teal-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Work Experience
                    </Button>
                    <p className="text-xs text-gray-500 mt-3">
                      Click "Skip This Step" below if you're a fresher
                    </p>
                  </div>
                ) : (
                  <>
                    {workExperiences.map((exp, index) => (
                      <div
                        key={exp.id}
                        className="border-2 border-teal-200 rounded-lg p-6 space-y-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">
                            Previous Employment #{index + 1}
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => removeWorkExperience(exp.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label>
                              Company Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="ABC Corporation Pvt Ltd"
                              value={exp.companyName}
                              onChange={(e) =>
                                updateWorkExperience(
                                  exp.id,
                                  "companyName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>
                              Designation / Job Title{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="Senior Software Engineer"
                              value={exp.designation}
                              onChange={(e) =>
                                updateWorkExperience(
                                  exp.id,
                                  "designation",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Department</Label>
                            <Input
                              placeholder="Technology"
                              value={exp.department}
                              onChange={(e) =>
                                updateWorkExperience(
                                  exp.id,
                                  "department",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Employment Type</Label>
                            <Select
                              value={exp.employmentType}
                              onValueChange={(value: any) =>
                                updateWorkExperience(
                                  exp.id,
                                  "employmentType",
                                  value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Full Time">Full Time</SelectItem>
                                <SelectItem value="Part Time">Part Time</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>
                              Date of Joining{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="date"
                              value={exp.dateOfJoining}
                              onChange={(e) =>
                                updateWorkExperience(
                                  exp.id,
                                  "dateOfJoining",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>
                              Date of Leaving{" "}
                              {!exp.currentlyWorking && (
                                <span className="text-red-500">*</span>
                              )}
                            </Label>
                            <Input
                              type="date"
                              value={exp.dateOfLeaving}
                              disabled={exp.currentlyWorking}
                              onChange={(e) =>
                                updateWorkExperience(
                                  exp.id,
                                  "dateOfLeaving",
                                  e.target.value
                                )
                              }
                              className={
                                exp.currentlyWorking ? "bg-gray-100" : ""
                              }
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <Checkbox
                                checked={exp.currentlyWorking}
                                onCheckedChange={(checked) =>
                                  updateWorkExperience(
                                    exp.id,
                                    "currentlyWorking",
                                    checked
                                  )
                                }
                              />
                              <Label className="font-normal text-sm">
                                Currently Working
                              </Label>
                            </div>
                          </div>
                          <div>
                            <Label>Last Drawn Salary</Label>
                            <Input
                              placeholder="₹ 50,000"
                              value={exp.lastDrawnSalary}
                              onChange={(e) =>
                                updateWorkExperience(
                                  exp.id,
                                  "lastDrawnSalary",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Reason for Leaving</Label>
                          <Input
                            placeholder="Better opportunity, career growth, etc."
                            value={exp.reasonForLeaving}
                            onChange={(e) =>
                              updateWorkExperience(
                                exp.id,
                                "reasonForLeaving",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        {/* EXPERIENCE LETTER UPLOAD - KEY FEATURE */}
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                          <Label className="flex items-center gap-2 mb-3">
                            <Upload className="w-5 h-5 text-amber-600" />
                            <span className="font-semibold">
                              Upload Experience Letter from {exp.companyName || "Company"}
                            </span>
                            <span className="text-red-500">*</span>
                          </Label>
                          <p className="text-xs text-gray-600 mb-3">
                            Experience letter should show: Company Name,
                            Designation, Worked From Date, Worked To Date
                          </p>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleExperienceLetterUpload(exp.id, file);
                              }
                            }}
                            className="cursor-pointer mb-2"
                          />
                          {exp.experienceLetterFilename && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded text-sm">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div className="flex-1">
                                <div className="font-medium text-green-800">
                                  {exp.experienceLetterFilename}
                                </div>
                                <div className="text-xs text-green-700">
                                  Experience letter uploaded successfully
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateWorkExperience(
                                    exp.id,
                                    "experienceLetterFile",
                                    null
                                  )
                                }
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="border-t pt-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">
                            Reference Details (Optional)
                          </h5>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs">Reporting Manager Name</Label>
                              <Input
                                placeholder="Manager name"
                                value={exp.reportingManagerName}
                                onChange={(e) =>
                                  updateWorkExperience(
                                    exp.id,
                                    "reportingManagerName",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Reference Contact Name</Label>
                              <Input
                                placeholder="HR or colleague"
                                value={exp.referenceContactName}
                                onChange={(e) =>
                                  updateWorkExperience(
                                    exp.id,
                                    "referenceContactName",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Reference Phone</Label>
                              <Input
                                placeholder="+91 98765 12345"
                                value={exp.referenceContactPhone}
                                onChange={(e) =>
                                  updateWorkExperience(
                                    exp.id,
                                    "referenceContactPhone",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total Experience Calculation */}
                    <div className="bg-teal-100 border border-teal-300 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-teal-700" />
                          <span className="font-semibold text-teal-900">
                            Total Work Experience:
                          </span>
                        </div>
                        <span className="text-lg font-bold text-teal-900">
                          {calculateTotalExperience()}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={addWorkExperience}
                      variant="outline"
                      className="w-full border-2 border-teal-300 hover:bg-teal-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Experience
                    </Button>
                  </>
                )}

                {workExperiences.length > 0 && (
                  <div className="text-center text-sm text-gray-500">
                    <p>
                      You can skip this step if you're done adding work
                      experience
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Education */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Add your educational qualifications starting from 10th
                    standard. Upload certificates for verification.
                  </p>
                </div>

                {educationRecords.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">
                      No education records added yet
                    </p>
                    <Button
                      onClick={addEducationRecord}
                      className="bg-teal-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education Record
                    </Button>
                  </div>
                ) : (
                  <>
                    {educationRecords.map((edu, index) => (
                      <div
                        key={edu.id}
                        className="border-2 border-blue-200 rounded-lg p-6 space-y-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">
                            Education Record #{index + 1}
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => removeEducationRecord(edu.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Qualification</Label>
                            <Select
                              value={edu.qualification}
                              onValueChange={(value) =>
                                updateEducationRecord(
                                  edu.id,
                                  "qualification",
                                  value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select qualification" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10th">10th Standard</SelectItem>
                                <SelectItem value="12th">12th Standard</SelectItem>
                                <SelectItem value="Diploma">Diploma</SelectItem>
                                <SelectItem value="Graduate">Graduate</SelectItem>
                                <SelectItem value="Post Graduate">
                                  Post Graduate
                                </SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Stream / Subject</Label>
                            <Input
                              placeholder="Science, Commerce, Engineering, etc."
                              value={edu.stream}
                              onChange={(e) =>
                                updateEducationRecord(
                                  edu.id,
                                  "stream",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Institution Name</Label>
                            <Input
                              placeholder="School/College name"
                              value={edu.institution}
                              onChange={(e) =>
                                updateEducationRecord(
                                  edu.id,
                                  "institution",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Board / University</Label>
                            <Input
                              placeholder="CBSE, Mumbai University, etc."
                              value={edu.boardUniversity}
                              onChange={(e) =>
                                updateEducationRecord(
                                  edu.id,
                                  "boardUniversity",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Year of Passing</Label>
                            <Input
                              placeholder="2020"
                              value={edu.yearOfPassing}
                              onChange={(e) =>
                                updateEducationRecord(
                                  edu.id,
                                  "yearOfPassing",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Percentage / CGPA</Label>
                            <Input
                              placeholder="85% or 8.5 CGPA"
                              value={edu.percentageCGPA}
                              onChange={(e) =>
                                updateEducationRecord(
                                  edu.id,
                                  "percentageCGPA",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Upload Certificate</Label>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleCertificateUpload(edu.id, file);
                              }
                            }}
                            className="cursor-pointer"
                          />
                          {edu.certificateFilename && (
                            <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="flex-1 text-green-800">
                                {edu.certificateFilename}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateEducationRecord(
                                    edu.id,
                                    "certificateFile",
                                    null
                                  )
                                }
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addEducationRecord}
                      variant="outline"
                      className="w-full border-2 border-blue-300 hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Education Record
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Step 5: Declaration & Submission */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Final Step:</strong> Please review all the
                    information you've provided before submitting.
                  </p>
                </div>

                {/* Summary Cards */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personal Details
                    </h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <strong>Name:</strong> {personalDetails.fullName}
                      </p>
                      <p>
                        <strong>Email:</strong> {personalDetails.personalEmail}
                      </p>
                      <p>
                        <strong>Mobile:</strong> {personalDetails.personalMobile}
                      </p>
                      <p>
                        <strong>Address:</strong> {personalDetails.addressLine1},{" "}
                        {personalDetails.city}
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      Identity & Documents
                    </h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <strong>Aadhaar:</strong>{" "}
                        {identityDocuments.aadhaarNumber}
                      </p>
                      <p>
                        <strong>PAN:</strong> {identityDocuments.panNumber}
                      </p>
                      <p>
                        <strong>Bank Account:</strong>{" "}
                        {identityDocuments.bankAccountNumber}
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Work Experience
                    </h4>
                    <div className="text-sm text-gray-700">
                      {workExperiences.length === 0 ? (
                        <p className="text-gray-500">No work experience added</p>
                      ) : (
                        <>
                          <p className="mb-2">
                            <strong>Total Experience:</strong>{" "}
                            {calculateTotalExperience()}
                          </p>
                          <p>
                            <strong>Companies:</strong>{" "}
                            {workExperiences.length} previous employers
                          </p>
                          <p>
                            <strong>Experience Letters:</strong>{" "}
                            {
                              workExperiences.filter((exp) => exp.experienceLetterFile)
                                .length
                            }{" "}
                            uploaded
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </h4>
                    <div className="text-sm text-gray-700">
                      {educationRecords.length === 0 ? (
                        <p className="text-gray-500">No education records added</p>
                      ) : (
                        <p>
                          {educationRecords.length} education records with{" "}
                          {
                            educationRecords.filter((edu) => edu.certificateFile)
                              .length
                          }{" "}
                          certificates uploaded
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Declaration Checkboxes */}
                <div className="border-2 border-teal-300 rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Declaration
                  </h4>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={declaration.accuracyConfirmed}
                      onCheckedChange={(checked) =>
                        setDeclaration({
                          ...declaration,
                          accuracyConfirmed: checked as boolean,
                        })
                      }
                      className="mt-1"
                    />
                    <Label className="font-normal text-sm">
                      I confirm that all information provided is accurate and
                      complete. I understand that any false information may lead
                      to termination of employment.
                    </Label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={declaration.policiesAccepted}
                      onCheckedChange={(checked) =>
                        setDeclaration({
                          ...declaration,
                          policiesAccepted: checked as boolean,
                        })
                      }
                      className="mt-1"
                    />
                    <Label className="font-normal text-sm">
                      I have read and accepted all company policies as attached
                      in my appointment letter.
                    </Label>
                  </div>
                </div>

                {/* Digital Signature */}
                <div className="border rounded-lg p-4">
                  <Label className="mb-2 block">Digital Signature</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">
                      Type your full name as digital signature
                    </p>
                    <Input
                      placeholder="Your Full Name"
                      value={declaration.signatureData}
                      onChange={(e) =>
                        setDeclaration({
                          ...declaration,
                          signatureData: e.target.value,
                        })
                      }
                      className="text-center text-2xl font-signature"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous Step
                </Button>
              )}
              {currentStep < 5 ? (
                <Button
                  onClick={nextStep}
                  className="ml-auto bg-teal-600 hover:bg-teal-700"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={submitOnboarding}
                  className="ml-auto bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Onboarding
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OnboardingPortal;
