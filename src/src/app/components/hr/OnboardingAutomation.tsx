/**
 * Onboarding Automation Module
 * Demonstrates how new employees receive email/WhatsApp links for:
 * - Basic onboarding details
 * - Statutory forms (PF & ESIC)
 * - Document uploads
 * Shows link generation, tracking, and reminder automation
 */

import { DataService } from "../../services/DataService";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Mail,
  MessageSquare,
  Send,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  Link as LinkIcon,
  FileText,
  Shield,
  Upload,
  User,
  Calendar,
  ExternalLink,
  Bell,
  Settings,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import type { EmployeeDatabaseRecord } from "../../services/employeeDatabaseService";
import { offerLetterService } from "../../services/offerLetterService";
import type { OfferLetterRecord } from "../../services/offerLetterService";
import { onboardingLinksService } from "../../services/onboardingLinksService";
import type { OnboardingLink } from "../../services/onboardingLinksService";

export function OnboardingAutomation() {
  const [links, setLinks] = useState<OnboardingLink[]>([]);
  const [acceptedOffers, setAcceptedOffers] = useState<OfferLetterRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeDatabaseRecord[]>([]);

  // Sample link for template preview
  const sampleLink: OnboardingLink = {
    id: "sample-001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    email: "john.doe@example.com",
    mobile: "+91 98765 43210",
    linkType: "Full Onboarding",
    linkUrl: "https://example.com/onboard/sample-token-123",
    sentVia: "Both",
    sentOn: new Date().toISOString(),
    expiresOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Pending",
    completionPercentage: 0,
  };
  const [showNewLinkModal, setShowNewLinkModal] = useState(false);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [showWhatsAppTemplate, setShowWhatsAppTemplate] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [linkType, setLinkType] = useState("Full Onboarding");
  const [sentVia, setSentVia] = useState("Both");
  const [expiryDays, setExpiryDays] = useState(7);

  // Load data on mount
  useEffect(() => {
    // Load onboarding links
    setLinks(onboardingLinksService.getAll());

    // Load accepted offers
    setAcceptedOffers(offerLetterService.getAccepted());

    // Load all employees
    setEmployees(employeeDatabaseService.getAll());

    // Subscribe to changes
    const unsubscribeLinks = onboardingLinksService.subscribe((updatedLinks) => {
      setLinks(updatedLinks);
    });

    const unsubscribeOffers = offerLetterService.subscribe((allOffers) => {
      setAcceptedOffers(allOffers.filter(o => o.status === "Accepted"));
    });

    const unsubscribeEmployees = employeeDatabaseService.subscribe((updatedEmployees) => {
      setEmployees(updatedEmployees);
    });

    return () => {
      unsubscribeLinks();
      unsubscribeOffers();
      unsubscribeEmployees();
    };
  }, []);

  // Check for pre-selected employee from onboarding checklist
  useEffect(() => {
    const preselectEmployeeId = sessionStorage.getItem("onboarding_preselect_employee");
    const preselectLinkType = sessionStorage.getItem("onboarding_preselect_linktype");

    if (preselectEmployeeId && preselectLinkType) {
      // Set the pre-selected values
      setSelectedEmployeeId(preselectEmployeeId);
      setLinkType(preselectLinkType);

      // Open the modal
      setShowNewLinkModal(true);

      // Clear sessionStorage
      sessionStorage.removeItem("onboarding_preselect_employee");
      sessionStorage.removeItem("onboarding_preselect_linktype");
    }
  }, [employees, acceptedOffers]);

  // Get eligible employees (accepted offers, no active link, OR pre-selected employee)
  let eligibleEmployees = acceptedOffers
    .map(offer => {
      const emp = employees.find(e =>
        e.id === offer.employeeTempId || e.tempId === offer.employeeTempId
      );
      if (!emp) return null;

      // If this is the pre-selected employee, include it regardless
      const empId = emp.id || emp.tempId;
      if (empId === selectedEmployeeId) {
        return {
          ...emp,
          offerId: offer.id,
        };
      }

      // Check if employee already has an active onboarding link
      const hasActiveLink = onboardingLinksService.hasActiveLink(empId);
      if (hasActiveLink) return null;

      return {
        ...emp,
        offerId: offer.id,
      };
    })
    .filter(Boolean) as (EmployeeDatabaseRecord & { offerId: string })[];

  // If we have a pre-selected employee that's not in the eligible list, add them
  if (selectedEmployeeId && !eligibleEmployees.find(e => (e.id || e.tempId) === selectedEmployeeId)) {
    const preselectedEmp = employees.find(e => (e.id || e.tempId) === selectedEmployeeId);
    if (preselectedEmp) {
      eligibleEmployees = [{
        ...preselectedEmp,
        offerId: "",
      } as any, ...eligibleEmployees];
    }
  }

  const copyToClipboard = (text: string) => {
    // Fallback method that works in all contexts
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          () => {
            toast.success("Copied to clipboard!");
          },
          () => {
            // Fallback to legacy method
            fallbackCopyTextToClipboard(text);
          }
        );
      } else {
        // Use fallback method
        fallbackCopyTextToClipboard(text);
      }
    } catch (err) {
      // Use fallback method
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
    document.body.removeChild(textArea);
  };

  const generateLink = () => {
    // Validation
    if (!selectedEmployeeId) {
      toast.error("Please select an employee");
      return;
    }

    const selectedEmployee = eligibleEmployees.find(
      emp => (emp.id || emp.tempId) === selectedEmployeeId
    );

    if (!selectedEmployee) {
      toast.error("Employee not found");
      return;
    }

    const randomId = Math.random().toString(36).substring(2, 14);
    const generatedUrl = `https://cleancar360.com/onboard/${randomId}`;

    const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const newOnboardingLink: OnboardingLink = {
      id: `OBL${String(links.length + 1).padStart(3, "0")}`,
      employeeId: selectedEmployee.id || selectedEmployee.tempId,
      employeeName: selectedEmployee.fullName,
      email: selectedEmployee.email,
      mobile: selectedEmployee.mobile,
      linkType: linkType as any,
      linkUrl: generatedUrl,
      sentVia: sentVia as any,
      sentOn: new Date().toLocaleString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      expiresOn: expiryDate.toLocaleString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      status: "Pending",
      completionPercentage: 0,
    };

    onboardingLinksService.add(newOnboardingLink);
    setShowNewLinkModal(false);

    if (sentVia === "Email" || sentVia === "Both") {
      toast.success(`Email sent to ${selectedEmployee.email}`);
    }
    if (sentVia === "WhatsApp" || sentVia === "Both") {
      toast.success(`WhatsApp message sent to ${selectedEmployee.mobile}`);
    }

    // Reset form
    setSelectedEmployeeId("");
    setLinkType("Full Onboarding");
    setSentVia("Both");
    setExpiryDays(7);
  };

  const resendLink = (link: OnboardingLink) => {
    toast.success(`Onboarding link resent to ${link.employeeName}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Partially Complete":
        return "bg-amber-100 text-amber-800";
      case "Opened":
        return "bg-blue-100 text-blue-800";
      case "Expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Partially Complete":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "Expired":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const emailTemplate = (link: OnboardingLink) => `
Subject: Welcome to CleanCar 360° - Complete Your Onboarding

Dear ${link.employeeName},

Welcome to the CleanCar 360° family! We're excited to have you on board.

To complete your onboarding process, please click the link below:

🔗 ${link.linkUrl}

This link will allow you to:
${link.linkType === "Full Onboarding" ? `
✓ Submit your personal and work information
✓ Upload required documents (Aadhaar, PAN, Bank Details)
✓ Complete PF Form 11 (Provident Fund Declaration)
✓ Complete ESIC Form 1 (State Insurance Declaration)
✓ Add your nominees and family members
` : link.linkType === "Statutory Forms" ? `
✓ Complete PF Form 11 (Provident Fund Declaration)
✓ Complete ESIC Form 1 (State Insurance Declaration)
✓ Add your nominees and family members
` : `
✓ Upload required documents (Aadhaar, PAN, Bank Details, Photo)
`}

⏰ Please complete this within 7 days (by ${link.expiresOn})

If you face any issues, please contact HR at hr@cleancar360.com

Best regards,
HR Team
CleanCar 360°
  `;

  const whatsAppTemplate = (link: OnboardingLink) => `
🎉 *Welcome to CleanCar 360°!*

Hi ${link.employeeName},

Please complete your onboarding by clicking this link:
${link.linkUrl}

${link.linkType === "Full Onboarding" ? `
📋 *What you need to do:*
✅ Personal & work details
✅ Upload documents
✅ PF & ESIC forms
✅ Nominee details
` : link.linkType === "Statutory Forms" ? `
📋 *Complete:*
✅ PF Form 11
✅ ESIC Form 1
` : `
📋 *Upload documents:*
✅ Aadhaar, PAN, Bank Details, Photo
`}
⏰ Complete by: ${link.expiresOn.split(" ")[0]}

Need help? Contact HR
  `;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Back Button */}
      <BackButton to="/hr" label="Back to HR Dashboard" />

      {/* Header */}
      <Card className="border-2 border-teal-200 bg-teal-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="p-2 bg-teal-600 rounded-lg">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Onboarding Automation</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Send onboarding links via Email & WhatsApp to new employees
                </p>
              </div>
            </div>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => setShowNewLinkModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate New Link
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{links.length}</div>
              <div className="text-xs text-gray-600 mt-1">Total Links Sent</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {links.filter((l) => l.status === "Pending").length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {links.filter((l) => l.status === "Partially Complete").length}
              </div>
              <div className="text-xs text-gray-600 mt-1">In Progress</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {links.filter((l) => l.status === "Completed").length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">
                {Math.round(
                  links.reduce((acc, l) => acc + l.completionPercentage, 0) / links.length
                )}
                %
              </div>
              <div className="text-xs text-gray-600 mt-1">Avg. Completion</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="links" className="space-y-4">
        <TabsList>
          <TabsTrigger value="links">
            <LinkIcon className="w-4 h-4 mr-2" />
            Onboarding Links
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="w-4 h-4 mr-2" />
            Message Templates
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Settings className="w-4 h-4 mr-2" />
            Automation Rules
          </TabsTrigger>
        </TabsList>

        {/* Onboarding Links Tab */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Onboarding Links</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Link Type</TableHead>
                    <TableHead>Sent Via</TableHead>
                    <TableHead>Sent On</TableHead>
                    <TableHead>Expires On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{link.employeeName}</div>
                          <div className="text-xs text-gray-500">{link.employeeId}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {link.email}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {link.mobile}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{link.linkType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {link.sentVia === "Email" && <Mail className="w-4 h-4 text-blue-600" />}
                          {link.sentVia === "WhatsApp" && (
                            <MessageSquare className="w-4 h-4 text-green-600" />
                          )}
                          {link.sentVia === "Both" && (
                            <>
                              <Mail className="w-4 h-4 text-blue-600" />
                              <MessageSquare className="w-4 h-4 text-green-600" />
                            </>
                          )}
                          <span className="text-xs ml-1">{link.sentVia}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{link.sentOn}</TableCell>
                      <TableCell className="text-xs">{link.expiresOn}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(link.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(link.status)}
                            {link.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${
                                  link.completionPercentage === 100
                                    ? "bg-green-600"
                                    : link.completionPercentage > 0
                                    ? "bg-amber-600"
                                    : "bg-gray-400"
                                }`}
                                style={{ width: `${link.completionPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">
                              {link.completionPercentage}%
                            </span>
                          </div>
                          {link.lastAccessed && (
                            <div className="text-xs text-gray-500">
                              Last: {link.lastAccessed}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(link.linkUrl)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => resendLink(link)}>
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                          <a href={link.linkUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Email Template */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Email Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <pre className="text-xs whitespace-pre-wrap font-sans">
                    {emailTemplate(links[0] || sampleLink)}
                  </pre>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => copyToClipboard(emailTemplate(links[0] || sampleLink))}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Email Template
                </Button>
              </CardContent>
            </Card>

            {/* WhatsApp Template */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  WhatsApp Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <pre className="text-xs whitespace-pre-wrap font-sans">
                    {whatsAppTemplate(links[0] || sampleLink)}
                  </pre>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => copyToClipboard(whatsAppTemplate(links[0] || sampleLink))}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy WhatsApp Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automation Rules Tab */}
        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Automated Reminder Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Daily Reminder (Pending Links)</div>
                    <div className="text-xs text-gray-600">
                      Send reminder every day at 10:00 AM if status = Pending
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      Follow-up Reminder (Partially Complete)
                    </div>
                    <div className="text-xs text-gray-600">
                      Send reminder every 2 days if status = Partially Complete
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Expiry Warning (2 Days Before)</div>
                    <div className="text-xs text-gray-600">
                      Send warning when link expires in 2 days and status ≠ Completed
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">HR Escalation (5 Days Pending)</div>
                    <div className="text-xs text-gray-600">
                      Alert HR if link is pending for 5 days without access
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Link Modal */}
      {showNewLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Generate Onboarding Link</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewLinkModal(false);
                    setSelectedEmployeeId("");
                    setLinkType("Full Onboarding");
                    setSentVia("Both");
                    setExpiryDays(7);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {eligibleEmployees.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-700 mb-2">No Eligible Employees</h4>
                  <p className="text-sm text-gray-600">
                    All employees with accepted offers already have active onboarding links,
                    or there are no accepted offers yet.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label>Select Employee *</Label>
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose employee with accepted offer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleEmployees.map((emp) => (
                          <SelectItem
                            key={emp.tempId || emp.id}
                            value={emp.tempId || emp.id}
                          >
                            {emp.fullName} ({emp.id !== "PENDING" ? emp.id : emp.tempId}) - {emp.designation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedEmployeeId && (() => {
                    const emp = eligibleEmployees.find(
                      e => (e.id || e.tempId) === selectedEmployeeId
                    );
                    if (!emp) return null;

                    return (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>Email:</strong> {emp.email}</div>
                          <div><strong>Mobile:</strong> {emp.mobile}</div>
                          <div><strong>Department:</strong> {emp.department}</div>
                          <div><strong>Designation:</strong> {emp.designation}</div>
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <Label>Link Type *</Label>
                    <Select value={linkType} onValueChange={setLinkType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Onboarding">Full Onboarding (All Steps)</SelectItem>
                        <SelectItem value="Statutory Forms">Statutory Forms Only (PF & ESIC)</SelectItem>
                        <SelectItem value="Documents Only">Documents Upload Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Send Via *</Label>
                    <Select value={sentVia} onValueChange={setSentVia}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Both">Email + WhatsApp</SelectItem>
                        <SelectItem value="Email">Email Only</SelectItem>
                        <SelectItem value="WhatsApp">WhatsApp Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Link Expiry (days) *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Link will expire on: {new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      className="flex-1 bg-teal-600 hover:bg-teal-700"
                      onClick={generateLink}
                      disabled={!selectedEmployeeId}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Generate & Send Link
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowNewLinkModal(false);
                        setSelectedEmployeeId("");
                        setLinkType("Full Onboarding");
                        setSentVia("Both");
                        setExpiryDays(7);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}