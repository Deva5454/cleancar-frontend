/**
 * Employee Lifecycle Timeline Component
 *
 * Visual timeline showing employee lifecycle progression through states
 * Displays state transitions, onboarding progress, approvals, and audit trail
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  FileText,
  Briefcase,
  Calendar,
  ChevronRight,
} from "lucide-react";
import type { EmployeeLifecycle, StateTransition, LifecycleState } from "../../services/employeeLifecycleEngine";
import type { AuditLogEntry } from "../../services/auditLogService";

interface EmployeeLifecycleTimelineProps {
  lifecycle: EmployeeLifecycle;
  transitions?: StateTransition[];
  auditLogs?: AuditLogEntry[];
}

/**
 * Get state color and icon
 */
function getStateConfig(state: LifecycleState): {
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  label: string;
} {
  switch (state) {
    case "Draft":
      return {
        color: "text-gray-700",
        bgColor: "bg-gray-100",
        icon: <FileText className="w-5 h-5" />,
        label: "Draft",
      };
    case "Active":
      return {
        color: "text-blue-700",
        bgColor: "bg-blue-100",
        icon: <User className="w-5 h-5" />,
        label: "Active",
      };
    case "Probation":
      return {
        color: "text-yellow-700",
        bgColor: "bg-yellow-100",
        icon: <Clock className="w-5 h-5" />,
        label: "Probation",
      };
    case "Confirmed":
      return {
        color: "text-green-700",
        bgColor: "bg-green-100",
        icon: <CheckCircle className="w-5 h-5" />,
        label: "Confirmed",
      };
    case "Exit Initiated":
      return {
        color: "text-orange-700",
        bgColor: "bg-orange-100",
        icon: <AlertCircle className="w-5 h-5" />,
        label: "Exit Initiated",
      };
    case "Exited":
      return {
        color: "text-red-700",
        bgColor: "bg-red-100",
        icon: <XCircle className="w-5 h-5" />,
        label: "Exited",
      };
  }
}

/**
 * Onboarding progress indicator
 */
function OnboardingProgress({ lifecycle }: { lifecycle: EmployeeLifecycle }) {
  const steps = [
    { name: "Basic Info", key: "basicInfoComplete" as const },
    { name: "Document Upload", key: "documentsComplete" as const },
    { name: "Role Assignment", key: "roleAssignmentComplete" as const },
    { name: "Shift Assignment", key: "shiftAssignmentComplete" as const },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const isComplete = lifecycle.onboardingProgress[step.key];
        const isCurrent = lifecycle.onboardingProgress.currentStep === idx + 1;

        return (
          <div key={step.name} className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isComplete
                  ? "bg-green-100 text-green-700"
                  : isCurrent
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {isComplete ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-semibold">{idx + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{step.name}</div>
              {isCurrent && !isComplete && (
                <div className="text-xs text-blue-600">In Progress</div>
              )}
              {isComplete && (
                <div className="text-xs text-green-600">Completed</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * State timeline visualization
 */
function StateTimeline({ transitions }: { transitions: StateTransition[] }) {
  if (!transitions || transitions.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No state transitions yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transitions.map((transition, idx) => {
        const fromConfig = getStateConfig(transition.fromState);
        const toConfig = getStateConfig(transition.toState);
        const date = new Date(transition.triggeredAt);

        return (
          <div key={transition.transitionId} className="flex items-start gap-3">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full ${
                  idx === 0 ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
              {idx < transitions.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-200" />
              )}
            </div>

            {/* Transition details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${fromConfig.bgColor} ${fromConfig.color}`}>
                  {fromConfig.label}
                </Badge>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <Badge className={`${toConfig.bgColor} ${toConfig.color}`}>
                  {toConfig.label}
                </Badge>
              </div>
              <div className="text-xs text-gray-600">
                By {transition.triggeredBy} • {date.toLocaleDateString()}{" "}
                {date.toLocaleTimeString()}
              </div>
              {transition.reason && (
                <div className="text-xs text-gray-500 mt-1">
                  Reason: {transition.reason}
                </div>
              )}
              {transition.approvalRequired && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Approval Required
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Approval status display
 */
function ApprovalStatus({ lifecycle }: { lifecycle: EmployeeLifecycle }) {
  const approvals = [
    { type: "HR", data: lifecycle.hrApproval },
    { type: "City Manager", data: lifecycle.cityManagerApproval },
  ];

  const hasApprovals = approvals.some(a => a.data);

  if (!hasApprovals) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No approvals required yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {approvals.map(({ type, data }) => {
        if (!data) return null;

        const statusConfig = {
          Pending: {
            color: "bg-yellow-100 text-yellow-700",
            icon: <Clock className="w-4 h-4" />,
          },
          Approved: {
            color: "bg-green-100 text-green-700",
            icon: <CheckCircle className="w-4 h-4" />,
          },
          Rejected: {
            color: "bg-red-100 text-red-700",
            icon: <XCircle className="w-4 h-4" />,
          },
        };

        const config = statusConfig[data.status];

        return (
          <div key={type} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-900">{type}</div>
              <Badge className={config.color}>
                <span className="mr-1">{config.icon}</span>
                {data.status}
              </Badge>
            </div>
            {data.approvedBy && (
              <div className="text-xs text-gray-600">
                By {data.approvedBy}
                {data.approvedAt && (
                  <> • {new Date(data.approvedAt).toLocaleDateString()}</>
                )}
              </div>
            )}
            {data.comments && (
              <div className="text-xs text-gray-500 mt-1">{data.comments}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Audit log display
 */
function AuditLog({ logs }: { logs: AuditLogEntry[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No audit logs available
      </div>
    );
  }

  const recentLogs = logs.slice(0, 10); // Show last 10 events

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {recentLogs.map((log) => {
        const date = new Date(log.timestamp);
        const severityColors = {
          Info: "bg-blue-50 border-blue-200",
          Warning: "bg-yellow-50 border-yellow-200",
          Error: "bg-red-50 border-red-200",
          Critical: "bg-red-100 border-red-300",
        };

        return (
          <div
            key={log.auditId}
            className={`border rounded p-2 ${severityColors[log.severity]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {log.eventType}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {log.description}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {log.severity}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {log.performedBy} • {date.toLocaleDateString()}{" "}
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Main Timeline Component
 */
export function EmployeeLifecycleTimeline({
  lifecycle,
  transitions,
  auditLogs,
}: EmployeeLifecycleTimelineProps) {
  const currentStateConfig = getStateConfig(lifecycle.currentState);

  return (
    <div className="space-y-6">
      {/* Current State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div
              className={`w-12 h-12 rounded-full ${currentStateConfig.bgColor} ${currentStateConfig.color} flex items-center justify-center`}
            >
              {currentStateConfig.icon}
            </div>
            <div>
              <div>Current State: {currentStateConfig.label}</div>
              <div className="text-sm font-normal text-gray-600">
                Last updated: {new Date(lifecycle.updatedAt).toLocaleDateString()}
                {lifecycle.lastUpdatedBy && ` by ${lifecycle.lastUpdatedBy}`}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Onboarding Progress */}
      {["Draft", "Active"].includes(lifecycle.currentState) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Onboarding Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <OnboardingProgress lifecycle={lifecycle} />
          </CardContent>
        </Card>
      )}

      {/* Probation Info */}
      {lifecycle.currentState === "Probation" && lifecycle.probationEndDate && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-sm font-medium text-yellow-900">
                  Probation Period
                </div>
                <div className="text-sm text-yellow-700">
                  Ends on {new Date(lifecycle.probationEndDate).toLocaleDateString()}
                  {lifecycle.probationDurationDays && (
                    <> ({lifecycle.probationDurationDays} days)</>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exit Info */}
      {["Exit Initiated", "Exited"].includes(lifecycle.currentState) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-sm font-medium text-red-900">
                  Exit Process
                </div>
                {lifecycle.exitInitiatedDate && (
                  <div className="text-sm text-red-700">
                    Initiated: {new Date(lifecycle.exitInitiatedDate).toLocaleDateString()}
                  </div>
                )}
                {lifecycle.exitReason && (
                  <div className="text-sm text-red-700">
                    Reason: {lifecycle.exitReason}
                  </div>
                )}
                {lifecycle.lastWorkingDate && (
                  <div className="text-sm text-red-700">
                    Last Working Date: {new Date(lifecycle.lastWorkingDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalStatus lifecycle={lifecycle} />
        </CardContent>
      </Card>

      {/* State Timeline */}
      {transitions && transitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">State Transitions</CardTitle>
          </CardHeader>
          <CardContent>
            <StateTimeline transitions={transitions} />
          </CardContent>
        </Card>
      )}

      {/* Audit Log */}
      {auditLogs && auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditLog logs={auditLogs} />
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Validation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "Basic Info", value: lifecycle.validationStatus.hasBasicInfo },
              { label: "Documents", value: lifecycle.validationStatus.hasDocuments },
              { label: "Role Assigned", value: lifecycle.validationStatus.hasRole },
              { label: "Shift Assigned", value: lifecycle.validationStatus.hasShift },
              { label: "Can Activate", value: lifecycle.validationStatus.canActivate },
              { label: "Can Run Payroll", value: lifecycle.validationStatus.canRunPayroll },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{label}</span>
                {value ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
