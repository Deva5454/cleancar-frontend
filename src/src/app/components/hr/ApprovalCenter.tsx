/**
 * Approval Center
 *
 * Multi-level approval workflow for salary hold overrides
 * Supervisor → Cluster Manager → Operations Manager → HR Manager
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  User,
  FileText,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { salaryHoldService, SalaryHoldRecord } from "../../services/salaryHoldService";
import {
  APPROVAL_LEVELS,
  APPROVAL_LEVEL_ORDER,
  APPROVAL_STATUS,
} from "../../constants/payrollConstants";

export function ApprovalCenter() {
  const [pendingApprovals, setPendingApprovals] = useState<SalaryHoldRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SalaryHoldRecord | null>(null);
  const [currentUserLevel, setCurrentUserLevel] = useState<string>(APPROVAL_LEVELS.CLUSTER_MANAGER);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comments, setComments] = useState("");
  const [approverName, setApproverName] = useState("Jane Smith");

  useEffect(() => {
    loadPendingApprovals();

    // Subscribe to changes
    const unsubscribe = salaryHoldService.subscribe(() => {
      loadPendingApprovals();
    });

    // Check for overdue approvals every minute
    const interval = setInterval(() => {
      const overdue = salaryHoldService.checkOverdueApprovals();
      if (overdue.length > 0) {
        loadPendingApprovals();
      }
    }, 60000); // 1 minute

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentUserLevel]);

  const loadPendingApprovals = () => {
    const pending = salaryHoldService.getPendingApprovalsByLevel(currentUserLevel);
    setPendingApprovals(pending);
  };

  const handleApprove = () => {
    if (!selectedRecord) return;

    const success = salaryHoldService.approveOverride(
      selectedRecord.employeeId,
      approverName,
      "USER-001",
      comments
    );

    if (success) {
      toast.success(`Override request approved for ${selectedRecord.employeeName}`);
      setShowApprovalModal(false);
      setComments("");
      setSelectedRecord(null);
      loadPendingApprovals();
    } else {
      toast.error("Failed to approve override request");
    }
  };

  const handleReject = () => {
    if (!selectedRecord || !comments.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    const success = salaryHoldService.rejectOverride(
      selectedRecord.employeeId,
      approverName,
      "USER-001",
      comments
    );

    if (success) {
      toast.success(`Override request rejected for ${selectedRecord.employeeName}`);
      setShowApprovalModal(false);
      setComments("");
      setSelectedRecord(null);
      loadPendingApprovals();
    } else {
      toast.error("Failed to reject override request");
    }
  };

  const openApprovalModal = (record: SalaryHoldRecord, action: "approve" | "reject") => {
    setSelectedRecord(record);
    setActionType(action);
    setShowApprovalModal(true);
    setComments("");
  };

  const getStepStatus = (step: any) => {
    if (step.status === APPROVAL_STATUS.APPROVED) return "completed";
    if (step.status === APPROVAL_STATUS.REJECTED) return "rejected";
    if (step.status === APPROVAL_STATUS.OVERDUE) return "overdue";
    if (step.status === APPROVAL_STATUS.AUTO_ESCALATED) return "escalated";
    if (step.status === APPROVAL_STATUS.PENDING) return "pending";
    return "pending";
  };

  const formatDate = (isoString: string | undefined) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateElapsedHours = (escalatedAt: string | undefined) => {
    if (!escalatedAt) return 0;
    const start = new Date(escalatedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approval Center</h2>
          <p className="text-gray-600 mt-1">
            Salary hold override requests pending your approval
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Approval Hierarchy:</Label>
            <p className="text-xs font-semibold text-blue-700 mb-2">
              Supervisor → Cluster Manager → Operations Manager → HR Manager
            </p>
            <Label className="text-xs text-gray-500">Your Role (Demo Selector):</Label>
            <select
              value={currentUserLevel}
              onChange={(e) => setCurrentUserLevel(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {APPROVAL_LEVEL_ORDER.map((level) => (
                <option key={level} value={level}>
                  {level.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pending Count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-orange-900 mt-2">
                  {pendingApprovals.length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals List */}
      {pendingApprovals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No pending approvals</p>
            <p className="text-gray-400 text-sm mt-1">All clear at your level!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map((record) => {
            const currentStep = record.overrideRequest?.approvalChain[record.overrideRequest.currentLevel];
            const isOverdue = currentStep?.status === APPROVAL_STATUS.OVERDUE;
            const elapsedHours = calculateElapsedHours(currentStep?.escalatedAt);

            return (
              <Card
                key={record.employeeId}
                className={`transition-all ${
                  isOverdue ? "border-2 border-red-500 animate-pulse" : "border-gray-200"
                }`}
              >
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-lg">{record.employeeName}</CardTitle>
                        <Badge variant="destructive" className="text-xs">
                          SALARY ON HOLD
                        </Badge>
                        {isOverdue && (
                          <Badge className="bg-red-600 text-white text-xs animate-pulse">
                            ⏰ OVERDUE
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          📍 At: {currentUserLevel.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Employee ID: {record.employeeId}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Hold Date: {formatDate(record.holdDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {record.consecutiveAbsentDays} consecutive absent days
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Time Elapsed</p>
                      <p className={`text-lg font-bold ${isOverdue ? "text-red-600" : "text-orange-600"}`}>
                        {elapsedHours}h / 4h
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-6">
                  {/* Override Request Details */}
                  {record.overrideRequest && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="w-4 h-4 text-gray-500 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Requested By (Supervisor)</p>
                          <p className="font-medium text-sm">{record.overrideRequest.requestedBy}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(record.overrideRequest.requestedDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 text-gray-500 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Reason</p>
                          <p className="text-sm">{record.overrideRequest.reason}</p>
                          {record.overrideRequest.evidence && (
                            <p className="text-xs text-blue-600 mt-1">
                              📎 Evidence attached: {record.overrideRequest.evidence}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approval Workflow Stepper */}
                  {record.overrideRequest && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600 uppercase">
                        Approval Progress - Hierarchy: Supervisor → Cluster Manager → Operations Manager → HR Manager
                      </p>
                      <div className="flex items-center justify-between relative">
                        {record.overrideRequest.approvalChain.map((step, index) => {
                          const status = getStepStatus(step);
                          const isCurrent = index === record.overrideRequest!.currentLevel;

                          return (
                            <div key={step.level} className="flex items-center flex-1">
                              <div className="flex flex-col items-center flex-1">
                                {/* Circle */}
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                    status === "completed"
                                      ? "bg-green-500 border-green-600"
                                      : status === "rejected"
                                      ? "bg-red-500 border-red-600"
                                      : status === "overdue"
                                      ? "bg-red-100 border-red-500 animate-pulse"
                                      : status === "escalated"
                                      ? "bg-orange-500 border-orange-600"
                                      : isCurrent
                                      ? "bg-blue-100 border-blue-500"
                                      : "bg-gray-200 border-gray-300"
                                  }`}
                                >
                                  {status === "completed" ? (
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                  ) : status === "rejected" ? (
                                    <XCircle className="w-5 h-5 text-white" />
                                  ) : status === "overdue" ? (
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                  ) : (
                                    <Clock className={`w-5 h-5 ${isCurrent ? "text-blue-600" : "text-gray-400"}`} />
                                  )}
                                </div>

                                {/* Label */}
                                <p className={`text-xs mt-2 text-center font-medium ${
                                  isCurrent ? "text-blue-700" : "text-gray-600"
                                }`}>
                                  {step.level.replace(/_/g, " ")}
                                </p>

                                {/* Approver Name */}
                                {step.approverName && (
                                  <p className="text-xs text-gray-500 text-center mt-1">
                                    {step.approverName}
                                  </p>
                                )}

                                {/* Status Badge */}
                                {status === "overdue" && (
                                  <Badge className="mt-1 text-xs bg-red-600">OVERDUE</Badge>
                                )}
                                {status === "escalated" && (
                                  <Badge className="mt-1 text-xs bg-orange-600">AUTO-ESCALATED</Badge>
                                )}
                              </div>

                              {/* Connector Line */}
                              {index < record.overrideRequest!.approvalChain.length - 1 && (
                                <ChevronRight className="w-5 h-5 text-gray-400 -mx-2" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2 border-t">
                    <Button
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => openApprovalModal(record, "approve")}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => openApprovalModal(record, "reject")}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className={`${
              actionType === "approve" ? "bg-green-50" : "bg-red-50"
            }`}>
              <CardTitle className="flex items-center gap-2">
                {actionType === "approve" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span>Approve Override Request</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span>Reject Override Request</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-sm text-gray-600">Employee</p>
                <p className="font-semibold">{selectedRecord.employeeName}</p>
              </div>

              <div>
                <Label htmlFor="approverName">Your Name *</Label>
                <Input
                  id="approverName"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="comments">
                  Comments {actionType === "reject" && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Optional: Add any comments..."
                      : "Required: Please provide reason for rejection"
                  }
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setShowApprovalModal(false)}>
                  Cancel
                </Button>
                <Button
                  className={`flex-1 ${
                    actionType === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  onClick={actionType === "approve" ? handleApprove : handleReject}
                >
                  {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
