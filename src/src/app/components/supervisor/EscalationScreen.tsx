/**
 * MODULE 6: Escalation & Emergency Actions
 * Time-critical action system (≤2 taps per action)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  UserX,
  LogOut,
  Repeat,
  PauseCircle,
  Camera,
  Bell,
  DollarSign,
  ArrowRightLeft,
  Package,
  AlertOctagon,
} from "lucide-react";
import type { Issue, EscalationSummary } from "../../services/escalationService";

export interface EscalationScreenProps {
  issues: Issue[];
  summary: EscalationSummary;
  onManualOverride: () => void;
  onForceCheckout: (washerId: string) => void;
  onReassignCover: () => void;
  onPauseSchedule: (washerId: string) => void;
  onVehicleDamage: () => void;
  onSOSAlert: () => void;
  onIncentiveOverride: () => void;
  onReassignCar: () => void;
  onBatchInvalidation: () => void;
  onEscalateToOps: (issueId: string) => void;
  onMarkInProgress: (issueId: string) => void;
  onResolveIssue: (issueId: string) => void;
}

export function EscalationScreen({
  issues,
  summary,
  onManualOverride,
  onForceCheckout,
  onReassignCover,
  onPauseSchedule,
  onVehicleDamage,
  onSOSAlert,
  onIncentiveOverride,
  onReassignCar,
  onBatchInvalidation,
  onEscalateToOps,
  onMarkInProgress,
  onResolveIssue,
}: EscalationScreenProps) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const issueTypeConfig = {
    ATTENDANCE: { label: "Attendance", color: "bg-amber-100 text-amber-700 border-amber-300" },
    QUALITY: { label: "Quality", color: "bg-red-100 text-red-700 border-red-300" },
    DAMAGE: { label: "Damage", color: "bg-red-100 text-red-700 border-red-300" },
    SAFETY: { label: "Safety", color: "bg-red-100 text-red-700 border-red-300" },
    TECHNICAL: { label: "Technical", color: "bg-blue-100 text-blue-700 border-blue-300" },
    CUSTOMER_COMPLAINT: {
      label: "Customer",
      color: "bg-purple-100 text-purple-700 border-purple-300",
    },
    OTHER: { label: "Other", color: "bg-gray-100 text-gray-700 border-gray-300" },
  };

  const statusConfig = {
    OPEN: { label: "Open", color: "bg-red-100 text-red-700 border-red-300", icon: AlertTriangle },
    IN_PROGRESS: {
      label: "In Progress",
      color: "bg-blue-100 text-blue-700 border-blue-300",
      icon: Clock,
    },
    ESCALATED: {
      label: "Escalated",
      color: "bg-purple-100 text-purple-700 border-purple-300",
      icon: AlertOctagon,
    },
    RESOLVED: {
      label: "Resolved",
      color: "bg-green-100 text-green-700 border-green-300",
      icon: CheckCircle,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-red-600 to-red-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Escalation Control Panel</h1>
          <p className="text-sm text-red-100">Emergency Actions</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <p className="text-2xl font-bold">{summary.openCount}</p>
            <p className="text-xs text-red-100">Open Issues</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <p className="text-2xl font-bold text-red-200">{summary.criticalCount}</p>
            <p className="text-xs text-red-100">Critical (&gt;15m)</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <p className="text-2xl font-bold">{summary.avgResponseTimeMinutes}m</p>
            <p className="text-xs text-red-100">Avg Response</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* SOS ALERT (ALWAYS VISIBLE) */}
        <Card className="border-4 border-red-600 bg-red-50 shadow-lg">
          <CardContent className="p-4">
            <Button
              className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-lg animate-pulse"
              onClick={onSOSAlert}
            >
              <Bell className="h-6 w-6 mr-3" />
              🔴 SOS — SAFETY ALERT
            </Button>
            <p className="text-xs text-center text-red-600 mt-2">
              Emergency: Alerts Supervisor, Ops Manager, City Manager + GPS
            </p>
          </CardContent>
        </Card>

        {/* ESCALATION MATRIX */}
        <Card className="border-2 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📊 Escalation Matrix</CardTitle>
            <p className="text-xs text-gray-600">Who handles what</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-2 font-bold text-gray-700">Issue Type</th>
                    <th className="text-left py-2 px-2 font-bold text-gray-700">Handled By</th>
                    <th className="text-right py-2 px-2 font-bold text-gray-700">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2">
                      <Badge className="bg-amber-100 text-amber-700 border-amber-300">Attendance</Badge>
                    </td>
                    <td className="py-2 px-2 text-gray-700">Supervisor → Ops Manager</td>
                    <td className="py-2 px-2 text-right text-gray-600">15m</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2">
                      <Badge className="bg-red-100 text-red-700 border-red-300">Quality</Badge>
                    </td>
                    <td className="py-2 px-2 text-gray-700">Supervisor → Ops Manager</td>
                    <td className="py-2 px-2 text-right text-gray-600">10m</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2">
                      <Badge className="bg-red-100 text-red-700 border-red-300">Damage</Badge>
                    </td>
                    <td className="py-2 px-2 text-gray-700">Supervisor → Ops Mgr → City Mgr</td>
                    <td className="py-2 px-2 text-right text-gray-600">5m</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2">
                      <Badge className="bg-red-100 text-red-700 border-red-300">Safety</Badge>
                    </td>
                    <td className="py-2 px-2 text-gray-700 font-bold">All Managers + SOS</td>
                    <td className="py-2 px-2 text-right text-red-600 font-bold">2m</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">Technical</Badge>
                    </td>
                    <td className="py-2 px-2 text-gray-700">Supervisor → Ops Manager</td>
                    <td className="py-2 px-2 text-right text-gray-600">20m</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-300">Customer</Badge>
                    </td>
                    <td className="py-2 px-2 text-gray-700">Supervisor → CRM Team</td>
                    <td className="py-2 px-2 text-right text-gray-600">30m</td>
                  </tr>
                  {/* REMOVED: Direct Finance escalation path - must follow hierarchy
                  <tr>
                    <td className="py-2 px-2">
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300">Incentive</Badge>
                    </td>
                    <td className="py-2 px-2 text-gray-700">Supervisor → Finance → Super Admin</td>
                    <td className="py-2 px-2 text-right text-gray-600">48h</td>
                  </tr>
                  */}
                  <tr>
                    <td className="py-2 px-2">
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300">Incentive</Badge>
                    </td>
                    <td className="py-2 px-2 text-gray-700">Supervisor → Ops Manager → Finance</td>
                    <td className="py-2 px-2 text-right text-gray-600">48h</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-bold">Auto-escalation:</span> If not resolved within SLA
              </p>
              <div className="flex gap-2 text-xs">
                <div className="flex-1 bg-green-50 border border-green-200 rounded p-2">
                  <p className="font-bold text-green-700">✓ Within SLA</p>
                  <p className="text-green-600">No escalation</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-200 rounded p-2">
                  <p className="font-bold text-red-700">⚠️ SLA Breach</p>
                  <p className="text-red-600">Auto to next level</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ISSUE LIST */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Open Issues ({issues.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {issues.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">No open issues</p>
            ) : (
              issues.map((issue) => {
                const config = statusConfig[issue.status];
                const StatusIcon = config.icon;
                const typeConfig = issueTypeConfig[issue.type];

                return (
                  <Card
                    key={issue.id}
                    className={`border-2 ${
                      issue.isCritical ? "border-red-300 bg-red-50 animate-pulse" : "border-gray-300"
                    }`}
                  >
                    <CardContent className="p-3">
                      {/* Row 1: Washer + Status */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{issue.washerName}</p>
                          <p className="text-xs text-gray-600">{issue.washerId}</p>
                        </div>
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      {/* Current Level & Next Action */}
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <p className="font-semibold text-blue-900">📍 Current Level: Supervisor</p>
                        <p className="text-blue-700 mt-1">
                          {issue.status === "OPEN" || issue.status === "IN_PROGRESS"
                            ? "➡️ Next Action: Resolve or Escalate to Operations Manager"
                            : issue.status === "ESCALATED"
                            ? "⏳ Escalated to Operations Manager"
                            : "✅ Resolved"}
                        </p>
                      </div>

                      {/* Row 2: Type + Time */}
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
                        <div
                          className={`flex items-center gap-1 text-xs ${
                            issue.isCritical ? "text-red-600 font-bold" : "text-gray-600"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{issue.minutesSinceRaised}m ago</span>
                          {issue.isCritical && <span>🔴</span>}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-700 mb-2">{issue.description}</p>

                      {/* Actions */}
                      <div className="grid grid-cols-3 gap-2">
                        {issue.status === "OPEN" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={() => onMarkInProgress(issue.id)}
                          >
                            Start
                          </Button>
                        )}
                        {(issue.status === "OPEN" || issue.status === "IN_PROGRESS") && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => onResolveIssue(issue.id)}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={() => onEscalateToOps(issue.id)}
                            >
                              Escalate to OM
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Logging Notice */}
        <Card className="border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-3 text-center">
            <p className="text-xs font-semibold text-gray-700">
              ⚠️ All actions are recorded with timestamp and supervisor ID
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}