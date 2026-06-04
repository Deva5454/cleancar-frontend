// Job Info Tab - Customer & job information
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  MapPin,
  Copy,
  Map,
  Car,
  Package,
  Wrench,
  AlertCircle,
  FileText,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { QAAuditDrawer, type QAAuditData } from "./QAAuditDrawer";
import { logger } from "../../services/logger";

interface Job {
  id: string;
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
  specialNotes?: string;
  isDemoAccepted?: boolean;
  status?: string;
  verificationStatus?: "verified" | "flagged" | "failed" | "pending";
  qualityScore?: number;
  complianceScore?: number;
  qaRequired?: boolean;
}

interface WasherJobInfoProps {
  job: Job;
}

const equipmentList = [
  { id: "EQ-001", name: "Pressure Washer", required: true },
  { id: "EQ-002", name: "Foam Gun", required: true },
  { id: "EQ-003", name: "Microfiber Towels (Set)", required: true },
  { id: "EQ-004", name: "Vacuum Cleaner", required: false },
];

export function WasherJobInfo({ job }: WasherJobInfoProps) {
  const [equipmentStatus, setEquipmentStatus] = useState<Record<string, boolean>>(
    Object.fromEntries(equipmentList.map(eq => [eq.id, true]))
  );
  const [reportedIssues, setReportedIssues] = useState<Set<string>>(new Set());
  const [jobNotes, setJobNotes] = useState("");
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [showFailureForm, setShowFailureForm] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [shouldReschedule, setShouldReschedule] = useState(false);
  const [showQAAudit, setShowQAAudit] = useState(false);

  const fullAddress = job.addressLine1
    ? `${job.addressLine1}, ${job.area}, ${job.city} - ${job.pinCode}`
    : `${job.area}, ${job.city} - ${job.pinCode}`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    toast.success("Address copied to clipboard");
  };

  const handleOpenMaps = () => {
    const encodedAddress = encodeURIComponent(fullAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
    toast.success("Opening in Google Maps");
  };

  const handleEquipmentToggle = (equipmentId: string, isWorking: boolean) => {
    setEquipmentStatus(prev => ({ ...prev, [equipmentId]: isWorking }));
    if (!isWorking && !reportedIssues.has(equipmentId)) {
      setReportedIssues(prev => new Set(prev).add(equipmentId));
    }
  };

  const handleReportIssue = (equipmentId: string) => {
    toast.success("Equipment issue reported to Supervisor");
  };

  const handleQAAuditSubmit = (auditData: QAAuditData) => {
    logger.log("QA Audit submitted:", auditData);
    toast.success("QA Audit submitted successfully");
    setShowQAAudit(false);
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Customer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5 text-teal-600" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{job.customerFirstName}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-base text-gray-900 mt-1">{fullAddress}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAddress}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenMaps}
                className="flex-1"
              >
                <Map className="w-4 h-4 mr-2" />
                Open in Maps
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="w-5 h-5 text-teal-600" />
            Vehicle Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-center py-6 bg-gray-50 rounded-lg">
            <Car className="w-20 h-20 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Category</p>
              <p className="text-base text-gray-900 mt-1">{job.vehicleCategory}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Color</p>
              <p className="text-base text-gray-900 mt-1">{job.vehicleColor}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Brand</p>
              <p className="text-base text-gray-900 mt-1">{job.vehicleBrand}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Registration</p>
              <p className="text-base text-gray-900 mt-1 font-mono">{job.vehicleRegistration}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="w-5 h-5 text-teal-600" />
            Package Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xl font-bold text-teal-600">{job.packageName}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                    {({EXPRESS_WASH:"SHINE — Chamakti Subah",SMART_WASH:"PROTECT — Raksha Plan",ELITE_WASH:"ELITE — Raja Seva",ELITE_2W:"ELITE 2W",SHINE:"SHINE — Chamakti Subah",PROTECT:"PROTECT — Raksha Plan",ELITE:"ELITE — Raja Seva"}[job.packageType] ?? job.packageType)}
                  </Badge>
              <Badge variant="outline">{job.serviceFrequency}</Badge>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Subscription Progress</p>
            <p className="text-base text-gray-900 mt-1">{job.subscriptionMonth}</p>
          </div>

          {job.complimentaryBenefits && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-teal-900">Complimentary Benefit</p>
                  <p className="text-sm text-teal-700 mt-1">{job.complimentaryBenefits}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification & QA Section - Only show if job is Completed or Verified */}
      {(job.status === "Completed" || job.status === "Verified" || job.verificationStatus) && (
        <Collapsible open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
          <Card className={`border-2 ${
            job.verificationStatus === "verified" ? "border-green-300 bg-green-50" :
            job.verificationStatus === "flagged" ? "border-orange-300 bg-orange-50" :
            job.verificationStatus === "failed" ? "border-red-300 bg-red-50" :
            "border-gray-300"
          }`}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    Verification & QA
                    {job.qaRequired && (
                      <Badge className="bg-orange-500 text-white">QA Required</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {job.verificationStatus && (
                      <Badge className={`${
                        job.verificationStatus === "verified" ? "bg-green-600 text-white" :
                        job.verificationStatus === "flagged" ? "bg-orange-500 text-white" :
                        job.verificationStatus === "failed" ? "bg-red-600 text-white" :
                        "bg-gray-500 text-white"
                      }`}>
                        {job.verificationStatus === "verified" ? "✓ Verified" :
                         job.verificationStatus === "flagged" ? "⚠ Flagged" :
                         job.verificationStatus === "failed" ? "✗ Failed" :
                         "Pending"}
                      </Badge>
                    )}
                    {isVerificationOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <div className="bg-white rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Quality Score */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-900">Quality Score</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {job.qualityScore !== undefined ? `${job.qualityScore}/100` : "N/A"}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">System Calculated</p>
                    </div>

                    {/* Compliance Score */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-medium text-purple-900">Compliance Score</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {job.complianceScore !== undefined ? `${job.complianceScore}/100` : "N/A"}
                      </p>
                      <p className="text-xs text-purple-700 mt-1">System Calculated</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600">
                      <strong>Note:</strong> Scores are system-driven based on checklist completion, photo quality,
                      timing adherence, and QA audit results. These scores directly impact your incentive calculations.
                    </p>
                  </div>

                  {/* QA Audit Button - Show if QA is required */}
                  {job.qaRequired && (
                    <Button
                      onClick={() => setShowQAAudit(true)}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Perform QA Audit
                    </Button>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Mark as Failed Section - Only show if job is In Progress */}
      {job.status === "In Progress" && !showFailureForm && (
        <Button
          variant="outline"
          onClick={() => setShowFailureForm(true)}
          className="w-full border-red-300 text-red-600 hover:bg-red-50"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Mark Job as Failed
        </Button>
      )}

      {/* Failure Form */}
      {showFailureForm && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-900">
              <XCircle className="w-5 h-5" />
              Mark Job as Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Failure Reason *</Label>
              <Select value={failureReason} onValueChange={setFailureReason}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select reason for failure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer-not-available">Customer Not Available</SelectItem>
                  <SelectItem value="vehicle-not-available">Vehicle Not Available</SelectItem>
                  <SelectItem value="equipment-failure">Equipment Failure</SelectItem>
                  <SelectItem value="weather-conditions">Weather Conditions</SelectItem>
                  <SelectItem value="safety-concern">Safety Concern</SelectItem>
                  <SelectItem value="access-denied">Access Denied to Premises</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Additional Details</Label>
              <Textarea
                placeholder="Provide additional details about why the job failed"
                className="min-h-20 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
              <Switch
                id="reschedule"
                checked={shouldReschedule}
                onCheckedChange={setShouldReschedule}
              />
              <Label htmlFor="reschedule" className="text-sm cursor-pointer">
                Auto-reschedule for next available slot
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFailureForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!failureReason}
                onClick={() => {
                  toast.error("Job marked as failed");
                  setShowFailureForm(false);
                }}
              >
                Confirm Failure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Notes */}
      {job.specialNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-teal-600" />
              Special Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-900">{job.specialNotes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Notes (Washer's own notes) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-teal-600" />
            My Job Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add your own notes for this job (optional)"
            value={jobNotes}
            onChange={(e) => setJobNotes(e.target.value)}
            className="min-h-20 text-base"
          />
          <p className="text-xs text-gray-500 mt-2">
            These notes are visible to your Supervisor after job completion
          </p>
        </CardContent>
      </Card>

      {/* Equipment Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="w-5 h-5 text-teal-600" />
            Equipment Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Verify all equipment is working before starting the job
          </p>

          {equipmentList.map((equipment) => (
            <div key={equipment.id} className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{equipment.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{equipment.id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Label htmlFor={`eq-${equipment.id}`} className="text-sm font-medium">
                    Working?
                  </Label>
                  <Switch
                    id={`eq-${equipment.id}`}
                    checked={equipmentStatus[equipment.id]}
                    onCheckedChange={(checked) => handleEquipmentToggle(equipment.id, checked)}
                  />
                </div>
              </div>

              {!equipmentStatus[equipment.id] && (
                <div className="ml-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium text-red-900">Equipment Issue</p>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Issue Type</Label>
                        <Select>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select issue type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not-working">Not Working</SelectItem>
                            <SelectItem value="damaged">Damaged - Physical</SelectItem>
                            <SelectItem value="degraded">Performance Degraded</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="stolen">Stolen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Description</Label>
                        <Textarea
                          placeholder="Describe the issue (minimum 20 characters)"
                          className="min-h-20 text-base"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch id={`urgent-${equipment.id}`} />
                        <Label htmlFor={`urgent-${equipment.id}`} className="text-sm">
                          Cannot continue without this
                        </Label>
                      </div>

                      <Button
                        size="sm"
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => handleReportIssue(equipment.id)}
                      >
                        Report Issue to Supervisor
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* QA Audit Drawer */}
      <QAAuditDrawer
        job={job as any}
        open={showQAAudit}
        onOpenChange={setShowQAAudit}
        onSubmit={handleQAAuditSubmit}
      />
    </div>
  );
}
