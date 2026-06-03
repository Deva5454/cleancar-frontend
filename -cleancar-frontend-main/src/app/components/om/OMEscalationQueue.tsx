/**
 * 3️⃣ OPERATIONS MANAGER: ESCALATION & APPROVALS QUEUE
 * Decision-making engine - Fast workflow for critical approvals
 * Focus: Speed + Impact visibility + Clear actions
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  AlertTriangle,
  Clock,
  User,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  ArrowUp,
  TrendingDown,
  DollarSign,
  Lock,
  Info,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { ESCALATION_AUTHORITY, PRIORITY_ORDER } from "../../constants/operationsManager.constants";
import { notificationService } from "../../services/notificationService";

type EscalationRequest = {
  id: string;
  priority: "CRITICAL" | "MEDIUM" | "LOW";
  type: "ATTENDANCE_OVERRIDE" | "COVER_REASSIGNMENT" | "EARLY_CHECKOUT" | "VEHICLE_DAMAGE" | "INCENTIVE_OVERRIDE" | "BATCH_INVALIDATION" | "SCHEDULE_PAUSE" | "COMPLAINT_ESCALATION" | "QUALITY_ISSUE" | "POLICY_EXCEPTION";
  details: string;
  attachments?: string[];
  impact: {
    units?: number;
    revenue?: number;
    payroll?: number;
  };
  requester: {
    name: string;
    role: string;
  };
  requestedBy: string;
  timeElapsed: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export interface OMEscalationQueueProps {
  escalations: EscalationRequest[];
  onApprove: (escalationId: string, notes?: string) => void;
  onReject: (escalationId: string, reason: string) => void;
  onRequestInfo: (escalationId: string, question: string) => void;
  onEscalate: (escalationId: string) => void;
}

export function OMEscalationQueue({
  escalations,
  onApprove,
  onReject,
  onRequestInfo,
  onEscalate,
}: OMEscalationQueueProps) {
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);

  const getPriorityConfig = (priority: EscalationRequest["priority"]) => {
    switch (priority) {
      case "CRITICAL":
        return { label: "🔴 Critical", color: "bg-red-600 text-white", bgColor: "bg-red-50 border-red-300" };
      case "MEDIUM":
        return { label: "🟡 Medium", color: "bg-yellow-600 text-white", bgColor: "bg-yellow-50 border-yellow-300" };
      case "LOW":
        return { label: "⚪ Low", color: "bg-gray-600 text-white", bgColor: "bg-white border-gray-300" };
    }
  };

  const getTypeLabel = (type: EscalationRequest["type"]) => {
    switch (type) {
      case "ATTENDANCE_OVERRIDE": return "Attendance Override";
      case "COVER_REASSIGNMENT": return "Cover Reassignment";
      case "EARLY_CHECKOUT": return "Early Checkout";
      case "VEHICLE_DAMAGE": return "Vehicle Damage";
      case "INCENTIVE_OVERRIDE": return "Incentive Override";
      case "BATCH_INVALIDATION": return "Batch Invalidation";
      case "SCHEDULE_PAUSE": return "Schedule Pause";
      case "COMPLAINT_ESCALATION": return "Complaint Escalation";
      case "QUALITY_ISSUE": return "Quality Issue";
      case "POLICY_EXCEPTION": return "Policy Exception";
    }
  };

  // ✅ OM CAN APPROVE
  const omCanApproveTypes: EscalationRequest["type"][] = ESCALATION_AUTHORITY.OM_CAN_APPROVE as any[];

  // 🚫 REQUIRES CITY MANAGER
  const requiresCityManagerTypes: EscalationRequest["type"][] = ESCALATION_AUTHORITY.REQUIRES_CITY_MANAGER as any[];

  // Special case: Cover reassignment requires City Manager if > 8 units
  const requiresCityManager = (escalation: EscalationRequest): boolean => {
    if (requiresCityManagerTypes.includes(escalation.type)) return true;
    if (escalation.type === "COVER_REASSIGNMENT" && escalation.impact.units && escalation.impact.units > ESCALATION_AUTHORITY.COVER_REASSIGNMENT_CM_THRESHOLD) {
      return true;
    }
    return false;
  };

  const canOMApprove = (escalation: EscalationRequest): boolean => {
    return !requiresCityManager(escalation);
  };

  const sortedEscalations = [...escalations].sort((a, b) => {
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.timeElapsed - a.timeElapsed;
  });

  const criticalCount = escalations.filter(e => e.priority === "CRITICAL").length;
  const pendingCount = escalations.filter(e => e.status === "PENDING").length;

  const handleApprove = (escalation: EscalationRequest) => {
    const notes = prompt("Approval notes (optional):");
    onApprove(escalation.id, notes || undefined);
    notificationService.success(
      "Escalation Approved",
      `${escalation.type} for ${escalation.requester.name} has been approved`
    );
  };

  const handleReject = (escalation: EscalationRequest) => {
    setSelectedEscalation(escalation);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (selectedEscalation && rejectReason.trim()) {
      onReject(selectedEscalation.id, rejectReason);
      notificationService.warning(
        "Escalation Rejected",
        `${selectedEscalation.type} for ${selectedEscalation.requester.name} has been rejected`
      );
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedEscalation(null);
    }
  };

  const handleRequestInfo = (escalation: EscalationRequest) => {
    const question = prompt("What information do you need?");
    if (question?.trim()) {
      onRequestInfo(escalation.id, question);
      notificationService.info(
        "Information Requested",
        `Request sent to ${escalation.requester.name}`
      );
    }
  };

  const handleAttachmentClick = (attachments: string[]) => {
    setSelectedAttachments(attachments);
    setShowAttachmentModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-red-900 to-red-800 text-white shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-2">Escalation & Approvals Queue</h1>
          <p className="text-sm text-red-200">Fast Decision Workflow</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* SUMMARY STRIP */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className={criticalCount > 0 ? "border-2 border-red-500 animate-pulse" : ""}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-gray-900">{criticalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{escalations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ESCALATION LIST */}
        <div className="space-y-4">
          {sortedEscalations.map((escalation) => {
            const priorityConfig = getPriorityConfig(escalation.priority);
            const isOverdue = escalation.timeElapsed > 30 && escalation.priority === "CRITICAL";

            return (
              <Card
                key={escalation.id}
                className={`border-2 ${priorityConfig.bgColor} ${
                  isOverdue ? "animate-pulse" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Priority Indicator */}
                    <div
                      className={`flex-shrink-0 p-3 rounded-lg ${
                        escalation.priority === "CRITICAL" ? "bg-red-600" : "bg-gray-300"
                      }`}
                    >
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={priorityConfig.color}>
                              {priorityConfig.label}
                            </Badge>
                            <Badge variant="outline">{getTypeLabel(escalation.type)}</Badge>
                            {isOverdue && (
                              <Badge className="bg-red-600 text-white animate-pulse">
                                ⚠️ OVERDUE
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {getTypeLabel(escalation.type)} Request
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {escalation.requestedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {escalation.timeElapsed} mins ago
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Level & Next Action */}
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                        <p className="font-semibold text-blue-900">📍 Current Level: Operations Manager</p>
                        <p className="text-blue-700 mt-1">
                          {canOMApprove(escalation)
                            ? "➡️ Next Action: Approve or Reject"
                            : "➡️ Next Action: Escalate to City Manager (Requires CM Approval)"}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Status: <span className="font-semibold">{escalation.status === "PENDING" ? "Pending Review" : escalation.status}</span>
                        </p>
                      </div>

                      {/* Details */}
                      <div className="p-3 bg-white rounded border border-gray-200 mb-3">
                        <p className="text-sm text-gray-700">{escalation.details}</p>
                        {escalation.attachments && escalation.attachments.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              {escalation.attachments.length} attachment(s)
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAttachmentClick(escalation.attachments)}
                            >
                              View Attachments
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Impact Metrics */}
                      <div className="flex items-center gap-4 mb-4">
                        {escalation.impact.units !== undefined && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-red-100 rounded text-red-700">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-sm font-semibold">-{escalation.impact.units} units</span>
                          </div>
                        )}
                        {escalation.impact.revenue !== undefined && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-red-100 rounded text-red-700">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-sm font-semibold">
                              ₹{(escalation.impact.revenue / 1000).toFixed(1)}k impact
                            </span>
                          </div>
                        )}
                        {escalation.impact.payroll !== undefined && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 rounded text-yellow-700">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-sm font-semibold">
                              ₹{(escalation.impact.payroll / 1000).toFixed(1)}k payroll
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {canOMApprove(escalation) && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(escalation)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {!canOMApprove(escalation) && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => onEscalate(escalation.id)}
                          >
                            <ArrowUp className="h-4 w-4 mr-1" />
                            Escalate to City Manager
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleReject(escalation)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestInfo(escalation)}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Request Info
                        </Button>
                        {/* REMOVED: Direct "Escalate to Director" - must follow hierarchy (OM → Cluster Manager → City Manager)
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEscalate(escalation.id)}
                        >
                          Escalate to Director
                        </Button>
                        */}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {escalations.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-600">No pending escalations at this time.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Escalation</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejection. This will be sent to the requester.
              </p>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 min-h-[100px]"
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                >
                  Confirm Rejection
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setSelectedEscalation(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ATTACHMENT MODAL */}
      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Attachments</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {selectedAttachments.map((attachment, index) => (
                  <div key={index} className="relative bg-gray-100 rounded-lg p-4">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-700 text-center">{attachment}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAttachmentModal(false);
                    setSelectedAttachments([]);
                  }}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}