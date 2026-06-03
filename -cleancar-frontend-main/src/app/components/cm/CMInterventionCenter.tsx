/**
 * OM INTERVENTION CENTER
 * PRIMARY WORKING SCREEN FOR CLUSTER MANAGER
 * 
 * Philosophy: Monitor → Detect Issue → Intervene → Track Outcome
 * This is an action-driven system, not a dashboard
 * 
 * System-triggered intervention cards with auto-generated alerts
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  DollarSign,
  UserMinus,
  AlertTriangle,
  Shield,
  AlertCircle,
  Key,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  TrendingDown,
} from "lucide-react";
import type { CMIntervention, CustomerEscalation } from "../../types/clusterManager.types";
import {
  INTERVENTION_TRIGGERS,
  INTERVENTION_SEVERITY,
  CUSTOMER_ESCALATION_TYPES,
  CURRENT_CM_ID,
} from "../../constants/clusterManager.constants";
import { clusterManagerService } from "../../services/clusterManagerService";

interface CMInterventionCenterProps {
  interventions: CMIntervention[];
  customerEscalations: CustomerEscalation[];
}

export function CMInterventionCenter({ interventions, customerEscalations }: CMInterventionCenterProps) {
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "ESCALATED">("ALL");
  const [selectedIntervention, setSelectedIntervention] = useState<CMIntervention | null>(null);
  const [rootCause, setRootCause] = useState("");
  const [actionTask, setActionTask] = useState("");
  const [actionDeadline, setActionDeadline] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationRecommendation, setEscalationRecommendation] = useState<"APPROVE" | "REJECT" | "REVIEW">("APPROVE");
  const [showEscalationModal, setShowEscalationModal] = useState(false);

  const filteredInterventions = interventions.filter((int) => {
    if (filter === "ALL") return int.status !== "RESOLVED";
    if (filter === "ESCALATED") return int.status === "ESCALATED_TO_CITY_MANAGER";
    return int.status === filter;
  });

  const getIcon = (triggerType: CMIntervention["triggerType"]) => {
    const iconMap = {
      REVENUE_DROP: DollarSign,
      RETENTION_FAILURE: UserMinus,
      COMPLAINT_DELAY: AlertTriangle,
      COMPLIANCE_FAILURE: Shield,
      CLUSTER_RISK: AlertCircle,
      OVERRIDE_PATTERN: Key,
      EARLY_CHURN: UserMinus,
      SALES_QUALITY: TrendingDown,
      CRM_DISCIPLINE: FileText,
      RENEWAL_FAILURE: ArrowUpCircle,
    };
    return iconMap[triggerType] || AlertCircle;
  };

  const handleUpdateIntervention = () => {
    if (!selectedIntervention) return;

    clusterManagerService.updateInterventionStatus(selectedIntervention.id, "IN_PROGRESS", {
      rootCause: rootCause || undefined,
      actionPlan: actionTask
        ? {
            task: actionTask,
            deadline: new Date(actionDeadline),
            notes: actionNotes,
          }
        : undefined,
      followUp: {
        nextReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        lastUpdate: new Date(),
      },
    });

    // Reset
    setSelectedIntervention(null);
    setRootCause("");
    setActionTask("");
    setActionDeadline("");
    setActionNotes("");
  };

  const handleEscalate = () => {
    if (!selectedIntervention) return;

    clusterManagerService.escalateInterventionToCityManager(
      selectedIntervention.id,
      escalationReason,
      [],
      escalationRecommendation
    );

    setShowEscalationModal(false);
    setSelectedIntervention(null);
    setEscalationReason("");
  };

  const handleResolve = () => {
    if (!selectedIntervention) return;

    clusterManagerService.updateInterventionStatus(selectedIntervention.id, "RESOLVED", {});

    setSelectedIntervention(null);
  };

  // Count critical items
  const criticalCount = interventions.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED").length;
  const pendingCount = interventions.filter((i) => i.status === "PENDING").length;
  const inProgressCount = interventions.filter((i) => i.status === "IN_PROGRESS").length;
  const escalatedCount = interventions.filter((i) => i.status === "ESCALATED_TO_CITY_MANAGER").length;

  return (
    <div className="space-y-6">
      {/* Cluster Risk Banner */}
      {interventions.some((i) => i.triggerType === "CLUSTER_RISK" && i.status !== "RESOLVED") && (
        <div className="bg-red-100 border-2 border-red-600 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900">🚨 Cluster Risk Detected</h3>
              <p className="text-sm text-red-800 mt-1">
                Multiple OMs underperforming simultaneously. Immediate intervention required.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                const clusterInt = interventions.find((i) => i.triggerType === "CLUSTER_RISK");
                if (clusterInt) setSelectedIntervention(clusterInt);
              }}
            >
              View Details
            </Button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border border-red-200 bg-red-50">
          <div className="text-xs text-slate-600 mb-1">Critical Interventions</div>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
        </Card>
        <Card className="p-4 border border-orange-200 bg-orange-50">
          <div className="text-xs text-slate-600 mb-1">Pending Action</div>
          <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
        </Card>
        <Card className="p-4 border border-blue-200 bg-blue-50">
          <div className="text-xs text-slate-600 mb-1">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
        </Card>
        <Card className="p-4 border border-purple-200 bg-purple-50">
          <div className="text-xs text-slate-600 mb-1">Escalated to City Manager</div>
          <div className="text-2xl font-bold text-purple-600">{escalatedCount}</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["ALL", "PENDING", "IN_PROGRESS", "ESCALATED"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f as any)}
          >
            {f.replace("_", " ")}
          </Button>
        ))}
      </div>

      {/* Intervention Cards */}
      <div className="space-y-4">
        {filteredInterventions.map((intervention) => {
          const triggerConfig = INTERVENTION_TRIGGERS[intervention.triggerType];
          const severityConfig = INTERVENTION_SEVERITY[intervention.severity];
          const Icon = getIcon(intervention.triggerType);

          return (
            <Card
              key={intervention.id}
              className={`p-5 border-l-4 ${triggerConfig.borderColor} ${
                intervention.severity === "CRITICAL" ? "bg-red-50" : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${triggerConfig.bgLight}`}>
                      <Icon className={`w-5 h-5 ${triggerConfig.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{intervention.omName}</h3>
                        <Badge className={`${triggerConfig.color} text-white`}>
                          {triggerConfig.label}
                        </Badge>
                        <Badge className={`${severityConfig.color} text-white`}>
                          {severityConfig.label}
                        </Badge>
                        <Badge variant="outline" className={`${
                          intervention.status === "PENDING" ? "border-red-600 text-red-600" :
                          intervention.status === "IN_PROGRESS" ? "border-blue-600 text-blue-600" :
                          "border-purple-600 text-purple-600"
                        }`}>
                          {intervention.status.replace("_", " ")}
                        </Badge>
                        {/* V10: Issue Source Badge */}
                        {intervention.issueSource && (
                          <Badge variant="outline" className={`text-xs ${
                            intervention.issueSource === "OPS" ? "border-blue-400 text-blue-700 bg-blue-50" :
                            intervention.issueSource === "SALES" ? "border-purple-400 text-purple-700 bg-purple-50" :
                            intervention.issueSource === "CRM" ? "border-amber-400 text-amber-700 bg-amber-50" :
                            intervention.issueSource === "FUNNEL" ? "border-indigo-400 text-indigo-700 bg-indigo-50" :
                            "border-gray-400 text-gray-700 bg-gray-50"
                          }`}>
                            {intervention.issueSource}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {intervention.daysSinceTrigger} days since trigger
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {intervention.triggeredAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KPI Snapshot */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <div className="text-xs font-semibold text-slate-700 mb-2">KPI Snapshot</div>
                    <div className="flex gap-4 text-sm">
                      {intervention.kpiSnapshot.revenue && (
                        <div>
                          <span className="text-slate-600">Revenue: </span>
                          <span className="font-semibold text-red-600">{intervention.kpiSnapshot.revenue}%</span>
                        </div>
                      )}
                      {intervention.kpiSnapshot.retention && (
                        <div>
                          <span className="text-slate-600">Retention: </span>
                          <span className="font-semibold text-red-600">{intervention.kpiSnapshot.retention}%</span>
                        </div>
                      )}
                      {intervention.kpiSnapshot.compliance && (
                        <div>
                          <span className="text-slate-600">Compliance: </span>
                          <span className="font-semibold text-red-600">{intervention.kpiSnapshot.compliance}%</span>
                        </div>
                      )}
                      {intervention.kpiSnapshot.complaints && (
                        <div>
                          <span className="text-slate-600">Complaints: </span>
                          <span className="font-semibold text-red-600">{intervention.kpiSnapshot.complaints}</span>
                        </div>
                      )}
                      {intervention.kpiSnapshot.overrides && (
                        <div>
                          <span className="text-slate-600">Overrides: </span>
                          <span className="font-semibold text-red-600">{intervention.kpiSnapshot.overrides}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Problem Summary */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-slate-700 mb-1">Problem Summary</div>
                    <p className="text-sm text-slate-900">{intervention.problemSummary}</p>
                  </div>

                  {/* Root Cause (if exists) */}
                  {intervention.rootCause && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-slate-700 mb-1">Root Cause Analysis</div>
                      <p className="text-sm text-slate-700 bg-blue-50 border border-blue-200 rounded p-2">
                        {intervention.rootCause}
                      </p>
                    </div>
                  )}

                  {/* Action Plan (if exists) */}
                  {intervention.actionPlan && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">Action Plan</div>
                      <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                        <div className="text-sm">
                          <span className="font-semibold text-green-900">Task: </span>
                          <span className="text-green-800">{intervention.actionPlan.task}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-green-700">
                          <div>
                            <span className="font-semibold">Deadline: </span>
                            {intervention.actionPlan.deadline.toLocaleString()}
                          </div>
                        </div>
                        {intervention.actionPlan.notes && (
                          <div className="text-sm text-green-800">
                            <span className="font-semibold">Notes: </span>
                            {intervention.actionPlan.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Follow-Up (if exists) */}
                  {intervention.followUp && (
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold">Next Review: </span>
                      {intervention.followUp.nextReviewDate.toLocaleDateString()}
                      {" • "}
                      <span className="font-semibold">Last Update: </span>
                      {intervention.followUp.lastUpdate.toLocaleTimeString()}
                    </div>
                  )}

                  {/* Escalation Details (if escalated) */}
                  {intervention.escalationDetails && (
                    <div className="mt-3 bg-purple-50 border border-purple-200 rounded p-3">
                      <div className="text-xs font-semibold text-purple-900 mb-2">
                        🔼 Escalated to City Manager
                      </div>
                      <div className="text-sm text-purple-800">
                        <div><strong>Reason:</strong> {intervention.escalationDetails.reason}</div>
                        <div className="mt-1">
                          <strong>Recommendation:</strong>{" "}
                          <Badge variant="outline" className="border-purple-600 text-purple-600">
                            {intervention.escalationDetails.recommendation}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  {intervention.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setSelectedIntervention(intervention)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Take Action
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600"
                        onClick={() => {
                          setSelectedIntervention(intervention);
                          setShowEscalationModal(true);
                        }}
                      >
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        Escalate Up
                      </Button>
                    </>
                  )}
                  {intervention.status === "IN_PROGRESS" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600"
                        onClick={() => {
                          setSelectedIntervention(intervention);
                          handleResolve();
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedIntervention(intervention)}
                      >
                        Update
                      </Button>
                    </>
                  )}
                  {intervention.status === "ESCALATED_TO_CITY_MANAGER" && (
                    <Badge variant="outline" className="border-purple-600 text-purple-600">
                      Awaiting CM Response
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Customer Escalations Section */}
      {customerEscalations.length > 0 && (
        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">🔥 Customer Escalations (CM Action Required)</h3>
          <div className="space-y-3">
            {customerEscalations.map((escalation) => {
              const typeConfig = CUSTOMER_ESCALATION_TYPES[escalation.escalationType];
              return (
                <Card
                  key={escalation.id}
                  className="p-4 border-2 border-red-600 bg-red-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">{escalation.customerName}</h4>
                        <Badge className={`${typeConfig.color} text-white`}>
                          {typeConfig.label}
                        </Badge>
                        {escalation.slaTimer.remainingMinutes < 30 && (
                          <Badge variant="destructive" className="gap-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            {escalation.slaTimer.remainingMinutes} min remaining
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{escalation.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>OM: {escalation.omName}</span>
                        <span>Created: {escalation.createdAt.toLocaleTimeString()}</span>
                        {escalation.details.complaintCount && (
                          <span>{escalation.details.complaintCount} complaints</span>
                        )}
                        {escalation.details.vehicleCount && (
                          <span>{escalation.details.vehicleCount} vehicles</span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="destructive">
                      Take Action Now
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Intervention Detail Modal */}
      {selectedIntervention && !showEscalationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Intervention Details: {selectedIntervention.omName}
            </h3>

            <div className="space-y-4">
              {/* Root Cause */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Root Cause Analysis <span className="text-red-600">*</span>
                </label>
                <Textarea
                  value={rootCause || selectedIntervention.rootCause || ""}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Describe the root cause of this issue..."
                  rows={3}
                />
              </div>

              {/* Action Plan */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Action Plan - Task <span className="text-red-600">*</span>
                </label>
                <Textarea
                  value={actionTask}
                  onChange={(e) => setActionTask(e.target.value)}
                  placeholder="Task assigned to OM..."
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Deadline <span className="text-red-600">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={actionDeadline}
                  onChange={(e) => setActionDeadline(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Notes
                </label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedIntervention(null);
                  setRootCause("");
                  setActionTask("");
                  setActionDeadline("");
                  setActionNotes("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdateIntervention}
                disabled={!rootCause && !actionTask}
              >
                Save & Track
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalationModal && selectedIntervention && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Escalate to City Manager
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Escalation Reason <span className="text-red-600">*</span>
                </label>
                <Textarea
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Why does this require City Manager intervention?"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Recommendation
                </label>
                <div className="flex gap-2">
                  {(["APPROVE", "REJECT", "REVIEW"] as const).map((rec) => (
                    <Button
                      key={rec}
                      size="sm"
                      variant={escalationRecommendation === rec ? "default" : "outline"}
                      onClick={() => setEscalationRecommendation(rec)}
                    >
                      {rec}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEscalationModal(false);
                  setEscalationReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleEscalate}
                disabled={!escalationReason}
              >
                Escalate Now
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
