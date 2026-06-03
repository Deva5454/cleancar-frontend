/**
 * ESCALATION & INTERVENTION QUEUE
 * CM's primary action screen
 * Exception-based workflow with resolve/assign/escalate actions
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  Paperclip,
} from "lucide-react";
import type { CMEscalation } from "../../types/clusterManager.types";
import { ESCALATION_PRIORITIES, CURRENT_CM_ID } from "../../constants/clusterManager.constants";
import { clusterManagerService } from "../../services/clusterManagerService";

interface CMEscalationQueueProps {
  escalations: CMEscalation[];
}

export function CMEscalationQueue({ escalations }: CMEscalationQueueProps) {
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM">("ALL");
  const [selectedEscalation, setSelectedEscalation] = useState<CMEscalation | null>(null);
  const [actionType, setActionType] = useState<"RESOLVE" | "ASSIGN" | "ESCALATE" | null>(null);
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState("");

  const filteredEscalations = escalations.filter((esc) => {
    if (filter === "ALL") return true;
    return esc.severity === filter;
  });

  const handleAction = () => {
    if (!selectedEscalation || !actionType) return;

    switch (actionType) {
      case "RESOLVE":
        clusterManagerService.resolveEscalation(selectedEscalation.id, CURRENT_CM_ID, notes);
        break;
      case "ASSIGN":
        if (deadline) {
          clusterManagerService.assignToOM(
            selectedEscalation.id,
            selectedEscalation.omId,
            new Date(deadline),
            notes
          );
        }
        break;
      case "ESCALATE":
        clusterManagerService.escalateToCityManager(selectedEscalation.id, CURRENT_CM_ID, notes);
        break;
    }

    // Reset
    setSelectedEscalation(null);
    setActionType(null);
    setNotes("");
    setDeadline("");
  };

  const getEscalationTypeLabel = (type: CMEscalation["type"]) => {
    const labels: Record<CMEscalation["type"], string> = {
      COMPLAINT_SLA: "Complaint SLA Breach",
      REVENUE_GAP: "Revenue Gap",
      RETENTION_FAILURE: "Retention Failure",
      INCENTIVE_REQUEST: "Incentive Request",
      COVER_CAPACITY: "Cover Capacity Issue",
      COMPLIANCE_BREACH: "Compliance Breach",
      OM_INACTIVITY: "OM Inactivity",
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border border-red-200 bg-red-50">
          <div className="text-xs text-slate-600 mb-1">Critical</div>
          <div className="text-2xl font-bold text-red-600">
            {escalations.filter((e) => e.severity === "CRITICAL").length}
          </div>
        </Card>
        <Card className="p-4 border border-orange-200 bg-orange-50">
          <div className="text-xs text-slate-600 mb-1">High Priority</div>
          <div className="text-2xl font-bold text-orange-600">
            {escalations.filter((e) => e.severity === "HIGH").length}
          </div>
        </Card>
        <Card className="p-4 border border-yellow-200 bg-yellow-50">
          <div className="text-xs text-slate-600 mb-1">Medium Priority</div>
          <div className="text-2xl font-bold text-yellow-600">
            {escalations.filter((e) => e.severity === "MEDIUM").length}
          </div>
        </Card>
        <Card className="p-4 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">Overdue (&gt;60 min)</div>
          <div className="text-2xl font-bold text-slate-900">
            {escalations.filter((e) => e.timePending > 60).length}
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f as any)}
          >
            {f}
            {f !== "ALL" && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {escalations.filter((e) => e.severity === f).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Escalation Cards */}
      <div className="space-y-3">
        {filteredEscalations.map((escalation) => {
          const priorityConfig = ESCALATION_PRIORITIES[escalation.severity];
          return (
            <Card
              key={escalation.id}
              className={`p-4 border-l-4 ${priorityConfig.borderColor} ${
                selectedEscalation?.id === escalation.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${priorityConfig.color} text-white`}>
                      {priorityConfig.label}
                    </Badge>
                    <Badge variant="outline">{getEscalationTypeLabel(escalation.type)}</Badge>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      {escalation.timePending} min pending
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-1">{escalation.description}</h3>

                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                    <span>OM: {escalation.omName}</span>
                    <span>Created: {escalation.createdAt.toLocaleTimeString()}</span>
                  </div>

                  {/* Current Level & Next Action */}
                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p className="font-semibold text-blue-900">📍 Current Level: Cluster Manager</p>
                    <p className="text-blue-700 mt-1">
                      ➡️ Next Action: Resolve, Assign to OM, or Escalate to City Manager
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Status: <span className="font-semibold">{escalation.status || "Pending Review"}</span>
                    </p>
                  </div>

                  {/* Impact */}
                  {(escalation.impact.revenue || escalation.impact.customers || escalation.impact.units) && (
                    <div className="flex items-center gap-4 text-xs text-slate-600 mb-2">
                      {escalation.impact.revenue && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ₹{escalation.impact.revenue.toLocaleString()} at risk
                        </div>
                      )}
                      {escalation.impact.customers && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {escalation.impact.customers} customers affected
                        </div>
                      )}
                      {escalation.impact.units && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {escalation.impact.units} units affected
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm text-blue-800">
                    <strong>Required Action:</strong> {escalation.requiredAction}
                  </div>

                  {escalation.attachments && escalation.attachments.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                      <Paperclip className="w-3 h-3" />
                      {escalation.attachments.length} attachment(s)
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => {
                      setSelectedEscalation(escalation);
                      setActionType("RESOLVE");
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setSelectedEscalation(escalation);
                      setActionType("ASSIGN");
                    }}
                  >
                    <Users className="w-4 h-4" />
                    Delegate to OM
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-purple-600 border-purple-600 hover:bg-purple-50"
                    onClick={() => {
                      setSelectedEscalation(escalation);
                      setActionType("ESCALATE");
                    }}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Escalate to City Manager
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredEscalations.length === 0 && (
          <Card className="p-8 border border-slate-200 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-600">No {filter.toLowerCase()} priority escalations</p>
          </Card>
        )}
      </div>

      {/* Action Modal */}
      {selectedEscalation && actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {actionType === "RESOLVE" && "Resolve Escalation"}
              {actionType === "ASSIGN" && "Delegate to Operations Manager"}
              {actionType === "ESCALATE" && "Escalate to City Manager"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Escalation ID
                </label>
                <Input value={selectedEscalation.id} disabled />
              </div>

              {actionType === "ASSIGN" && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Deadline <span className="text-red-600">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Notes <span className="text-red-600">*</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedEscalation(null);
                  setActionType(null);
                  setNotes("");
                  setDeadline("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAction}
                disabled={!notes || (actionType === "ASSIGN" && !deadline)}
              >
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}