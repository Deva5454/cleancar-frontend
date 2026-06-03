import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { BackButton } from "../ui/back-button";
import { CheckCircle, Clock, Upload, FileText, AlertCircle, X, UserCircle, Send, AlertTriangle, ShieldCheck, Key, ShieldAlert, RefreshCw, Eye, EyeOff, Copy, CheckCircle2, Unlock, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import type { EmployeeDatabaseRecord } from "../../services/employeeDatabaseService";
import { onboardingChecklistService } from "../../services/onboardingChecklistService";
import type { OnboardingTask } from "../../services/onboardingChecklistService";
import { authService } from "../../services/authService";
import { toast } from "sonner";
import { logger } from "../../services/logger";

export function EmployeeOnboarding() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeDatabaseRecord[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Credentials tab state
  const [resetPanelEmployeeId, setResetPanelEmployeeId] = useState<string | null>(null);
  const [generatedOTP, setGeneratedOTP] = useState<string>("");
  const [otpMobile, setOtpMobile] = useState<string>("");
  const [revealedMobile, setRevealedMobile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<EmployeeDatabaseRecord | null>(null);

  // Check if a task is a statutory form
  const isStatutoryForm = (taskName: string): boolean => {
    return taskName === "PF Form 11 (Statutory)" || taskName === "ESIC Form 1 (Statutory)";
  };

  // Load employees from database
  useEffect(() => {
    const activeEmployees = employeeDatabaseService.getAll().filter(emp => emp.status === "Active");
    setEmployees(activeEmployees);

    const unsubscribe = employeeDatabaseService.subscribe((allEmployees) => {
      const active = allEmployees.filter(emp => emp.status === "Active");
      setEmployees(active);
    });

    return unsubscribe;
  }, []);

  // Load checklist when employee is selected
  useEffect(() => {
    if (selectedEmployeeId) {
      const employeeTasks = onboardingChecklistService.getByEmployeeId(selectedEmployeeId);
      setTasks(employeeTasks);
    } else {
      setTasks([]);
    }
  }, [selectedEmployeeId]);

  // Save checklist when tasks change
  useEffect(() => {
    if (selectedEmployeeId && tasks.length > 0) {
      onboardingChecklistService.update(selectedEmployeeId, tasks);
    }
  }, [tasks, selectedEmployeeId]);

  // Monitor for contradiction flags and notify Super Admin
  useEffect(() => {
    if (selectedEmployeeId && tasks.length > 0) {
      const contradictedTasks = tasks.filter(t => t.contradictionFlagged);
      if (contradictedTasks.length > 0) {
        // In production, this would send a notification to Super Admin
        logger.log(
          `[ALERT] Contradiction flagged for employee ${selectedEmployeeId}:`,
          contradictedTasks.map(t => t.task).join(", ")
        );
        // TODO: Implement actual notification service call
        // notificationService.notifySuperAdmin({
        //   type: "document_contradiction",
        //   employeeId: selectedEmployeeId,
        //   tasks: contradictedTasks
        // });
      }
    }
  }, [tasks, selectedEmployeeId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Pending": return "bg-orange-100 text-orange-800";
      case "Not Started": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpload = (task: OnboardingTask) => {
    setSelectedTask(task);
    setShowUploadModal(true);
  };

  const handleFileUpload = () => {
    if (selectedTask && uploadFile) {
      const updatedTasks = tasks.map((t) =>
        t.task === selectedTask.task
          ? { ...t, status: "Completed" as const, completedOn: new Date().toISOString().split("T")[0] }
          : t
      );
      setTasks(updatedTasks);
      setShowUploadModal(false);
      setSelectedTask(null);
      setUploadFile(null);
      toast.success(`✅ Document Uploaded Successfully!\n\n${selectedTask.task} has been uploaded and marked as completed.`);
    }
  };

  const handleSendFormLink = () => {
    if (!selectedEmployeeId) {
      toast.info("⚠️ No employee selected");
      return;
    }

    // Store employee ID in sessionStorage for the onboarding automation screen to pick up
    sessionStorage.setItem("onboarding_preselect_employee", selectedEmployeeId);
    sessionStorage.setItem("onboarding_preselect_linktype", "Statutory Forms");

    // Navigate to onboarding automation
    navigate("/hr/onboarding-automation");
  };

  const handleVerifyDocument = (task: OnboardingTask, verified: boolean) => {
    const today = new Date().toISOString().split("T")[0];
    const updatedTasks = tasks.map((t) =>
      t.task === task.task
        ? {
            ...t,
            verified,
            verifiedBy: verified ? "HR Manager" : undefined,
            verifiedOn: verified ? today : undefined,
          }
        : t
    );
    setTasks(updatedTasks);
  };

  const completedCount = tasks.filter(t => t.status === "Completed").length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Count documents that are uploaded but not verified
  const unverifiedDocuments = tasks.filter(t => t.status === "Completed" && !t.verified);
  const unverifiedCount = unverifiedDocuments.length;

  // Check if any documents have contradictions flagged
  const contradictionFlagged = tasks.some(t => t.contradictionFlagged);

  const selectedEmployee = employees.find(emp =>
    emp.id === selectedEmployeeId || emp.tempId === selectedEmployeeId
  );

  // Credentials management handlers
  const handleGenerateResetOTP = (employeeId: string) => {
    const result = authService.initiatePasswordReset(employeeId, "HR_ADMIN");
    if (result.success && result.otp) {
      setGeneratedOTP(result.otp);
      setOtpMobile(result.maskedMobile || "");
      toast.success("OTP generated successfully!");
    } else {
      toast.error(result.error || "Failed to generate OTP");
    }
  };

  const handleUnlockAccount = (employeeId: string, employeeName: string) => {
    authService.unlockAccount(employeeId);
    toast.success(`Account unlocked for ${employeeName}`);
    // Refresh employees to show updated status
    setEmployees(employeeDatabaseService.getAll().filter(emp => emp.status === "Active"));
  };

  const handleCopyOTP = () => {
    navigator.clipboard.writeText(generatedOTP);
    toast.success("OTP copied to clipboard");
  };

  const handleSendWhatsApp = (employee: EmployeeDatabaseRecord) => {
    const msg = `Hello ${employee.firstName}, your CleanCar 360 password reset OTP is: ${generatedOTP}. Go to the login page, click Forgot Password, and enter this OTP. Valid for 15 minutes. Do not share.`;
    const whatsappMessage = encodeURIComponent(msg);
    const mobile = employee.loginMobile || employee.mobile;
    window.open(`https://wa.me/91${mobile}?text=${whatsappMessage}`, "_blank");
  };

  const handleCopyOnboardingLink = (employeeId: string) => {
    const link = `${window.location.origin}/onboarding/${employeeId}`;
    navigator.clipboard.writeText(link);
    toast.success("Onboarding link copied to clipboard");
  };

  const handleRevealMobile = (employeeId: string, mobile: string) => {
    setRevealedMobile(employeeId);
    setTimeout(() => setRevealedMobile(null), 5000);
  };

  const handleSearchLoginId = () => {
    const allEmployees = employeeDatabaseService.getAll();
    const found = allEmployees.find(emp =>
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.tempId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.mobile && emp.mobile.includes(searchQuery))
    );
    setSearchResult(found || null);
    if (!found) {
      toast.error("No employee found matching your search");
    }
  };

  const getAccountStatusBadge = (status: string) => {
    switch (status) {
      case "pending_onboarding":
        return <Badge className="bg-gray-200 text-gray-700">Pending Onboarding</Badge>;
      case "pending_password":
        return <Badge className="bg-amber-100 text-amber-800">Awaiting Password Set</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "locked":
        return <Badge className="bg-red-100 text-red-800">Locked</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  const formatLoginMobile = (emp: EmployeeDatabaseRecord) => {
    const mobile = emp.loginMobile || emp.mobile || "";
    if (revealedMobile === emp.id) {
      return mobile;
    }
    return mobile.slice(0, 5) + "XXXXX";
  };

  const lockedEmployees = employees.filter(emp => emp.accountStatus === "locked");

  return (
    <div className="space-y-6">
      <BackButton to="/hr" label="Back to HR Dashboard" />

      {/* Employee Selector Bar */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <UserCircle className="w-6 h-6 text-purple-600" />
            <div className="flex-1">
              <Label className="text-sm font-semibold text-purple-900 mb-2 block">
                Viewing onboarding for:
              </Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="bg-white border-purple-300">
                  <SelectValue placeholder="Select employee to view their checklist" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem
                      key={emp.tempId || emp.id}
                      value={emp.tempId || emp.id}
                    >
                      {emp.fullName} ({emp.id !== "PENDING" ? emp.id : emp.tempId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      {selectedEmployeeId && (
        <Tabs defaultValue="checklist" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Onboarding Checklist
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Account & Credentials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="space-y-6">
            {/* Progress Overview */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Onboarding Progress</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {completedCount} of {tasks.length} tasks completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">{completionPercentage}%</p>
                      <p className="text-xs text-blue-700">Complete</p>
                    </div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Onboarding Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>
              Onboarding Checklist — {selectedEmployee?.fullName} (
              {selectedEmployee?.id !== "PENDING" ? selectedEmployee?.id : selectedEmployee?.tempId})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Warning Banner for Unverified Documents */}
            {unverifiedCount > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    ⚠ {unverifiedCount} document{unverifiedCount > 1 ? "s" : ""} uploaded but not yet verified by HR.
                  </p>
                </div>
              </div>
            )}

            {/* Section Header */}
            <div className="mb-4 pb-3 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Document Verification — HR must verify each uploaded document against original
              </h3>
            </div>

            <div className="space-y-4">
              {tasks.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg transition-colors ${
                    item.contradictionFlagged
                      ? "border-red-300 bg-red-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {item.status === "Completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : item.status === "In Progress" ? (
                        <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                      ) : item.status === "Pending" ? (
                        <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{item.task}</p>
                          {item.contradictionFlagged && (
                            <Badge className="bg-red-600 text-white">
                              Contradiction Flagged
                            </Badge>
                          )}
                        </div>
                        {item.task === "Current Address Proof" && (
                          <p className="text-xs text-blue-600 mt-1">
                            Accepted documents: Gas bill, Electricity bill, or Current Rent Agreement (not older than 3 months)
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {item.completedOn && `✓ Completed: ${item.completedOn}`}
                          {item.dueDate && !item.completedOn && `Due: ${item.dueDate}`}
                          {item.uploadedOn && !item.completedOn && `Uploaded: ${item.uploadedOn}`}
                        </p>
                        {item.verified && item.verifiedBy && item.verifiedOn && (
                          <p className="text-xs text-gray-500 mt-1">
                            Verified by {item.verifiedBy} on{" "}
                            {new Date(item.verifiedOn).toLocaleDateString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      {item.verified && (
                        <Badge className="bg-green-100 text-green-800">Verified</Badge>
                      )}
                      {item.status !== "Completed" && isStatutoryForm(item.task) && (
                        <Button
                          size="sm"
                          onClick={handleSendFormLink}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Send Form Link
                        </Button>
                      )}
                      {item.status !== "Completed" && !isStatutoryForm(item.task) && (
                        <Button size="sm" onClick={() => handleUpload(item)}>
                          <Upload className="w-3 h-3 mr-1" />
                          Upload
                        </Button>
                      )}
                      {item.status === "Completed" && (
                        <>
                          <Button size="sm" variant="outline">
                            <FileText className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <div className="flex items-center gap-2 pl-2 border-l">
                            <Checkbox
                              id={`verify-${index}`}
                              checked={item.verified || false}
                              onCheckedChange={(checked) =>
                                handleVerifyDocument(item, checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={`verify-${index}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              Verified by HR
                            </Label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="credentials" className="space-y-6">
            {/* Account Status Overview Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  All Employee Accounts — Login Status & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <div className="min-w-[900px] sm:min-w-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee Name</TableHead>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Login Mobile</TableHead>
                          <TableHead>Account Status</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map(emp => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-medium">{emp.fullName}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {emp.id !== "PENDING" ? emp.id : emp.tempId}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">
                                  {formatLoginMobile(emp)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRevealMobile(emp.id, emp.loginMobile || emp.mobile)}
                                  className="h-6 w-6 p-0"
                                >
                                  {revealedMobile === emp.id ? (
                                    <EyeOff className="w-3 h-3" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getAccountStatusBadge(emp.accountStatus)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {emp.lastLogin
                                ? new Date(emp.lastLogin).toLocaleString("en-IN", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : <span className="text-gray-400">Never logged in</span>}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setResetPanelEmployeeId(emp.id);
                                    setGeneratedOTP("");
                                  }}
                                  className="text-xs"
                                >
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Reset Password
                                </Button>
                                {emp.accountStatus === "locked" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnlockAccount(emp.id, emp.fullName)}
                                    className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                                  >
                                    <Unlock className="w-3 h-3 mr-1" />
                                    Unlock
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyOnboardingLink(emp.tempId || emp.id)}
                                  className="text-xs"
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy Link
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Password Reset Panel (shown when Reset Password is clicked) */}
                {resetPanelEmployeeId && (() => {
                  const emp = employees.find(e => e.id === resetPanelEmployeeId);
                  if (!emp) return null;
                  return (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-blue-900">
                            Password Reset for {emp.fullName}
                          </h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Mobile: {otpMobile || formatLoginMobile(emp)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setResetPanelEmployeeId(null);
                            setGeneratedOTP("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {!generatedOTP ? (
                        <Button
                          onClick={() => handleGenerateResetOTP(emp.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Generate Reset OTP
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-3 bg-white rounded border border-blue-300">
                            <Label className="text-xs text-blue-700 uppercase tracking-wide">
                              Generated OTP
                            </Label>
                            <p className="text-2xl font-mono font-bold text-blue-900 tracking-widest mt-1">
                              {generatedOTP}
                            </p>
                            <p className="text-xs text-blue-600 mt-2">
                              ⏱ Valid for 15 minutes
                            </p>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Send to employee via:
                            </Label>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCopyOTP}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy OTP
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleSendWhatsApp(emp)}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Send via WhatsApp
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                            ℹ️ Employee must go to login page → "Forgot Password" → enter this OTP + set new password
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Login ID Recovery Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-600" />
                  Login ID Recovery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by name, employee ID, temp ID, or mobile..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearchLoginId()}
                      className="flex-1"
                    />
                    <Button onClick={handleSearchLoginId}>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>

                  {searchResult && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-purple-900">
                            {searchResult.fullName}
                          </p>
                          <p className="text-sm text-purple-700 mt-1">
                            Employee ID: {searchResult.id !== "PENDING" ? searchResult.id : searchResult.tempId}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Label className="text-xs text-purple-700 uppercase tracking-wide">
                              Login Mobile:
                            </Label>
                            <span className="font-mono text-sm font-bold text-purple-900">
                              {revealedMobile === searchResult.id
                                ? searchResult.loginMobile || searchResult.mobile
                                : formatLoginMobile(searchResult)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleRevealMobile(
                                  searchResult.id,
                                  searchResult.loginMobile || searchResult.mobile
                                )
                              }
                              className="h-6 w-6 p-0"
                            >
                              {revealedMobile === searchResult.id ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSearchResult(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Unlock Section */}
            {lockedEmployees.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    Locked Accounts ({lockedEmployees.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lockedEmployees.map(emp => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-red-900">{emp.fullName}</p>
                          <p className="text-sm text-red-700">
                            {emp.id !== "PENDING" ? emp.id : emp.tempId} •{" "}
                            {emp.lockedUntil
                              ? `Locked until ${new Date(emp.lockedUntil).toLocaleTimeString("en-IN")}`
                              : "Locked"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUnlockAccount(emp.id, emp.fullName)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Unlock className="w-3 h-3 mr-1" />
                          Unlock Account
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {!selectedEmployeeId && (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Employee Selected
            </h3>
            <p className="text-gray-600">
              Select an employee above to view or update their onboarding checklist.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Upload Document</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700">Document Type</Label>
                  <p className="font-medium text-gray-900 mt-1">{selectedTask.task}</p>
                </div>
                
                <div>
                  <Label>Upload File *</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>

                {uploadFile && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Selected: {uploadFile.name}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Size: {(uploadFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    className="flex-1" 
                    onClick={handleFileUpload}
                    disabled={!uploadFile}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}