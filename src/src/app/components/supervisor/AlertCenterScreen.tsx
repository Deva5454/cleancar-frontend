/**
 * MODULE 7: Automated Alert System
 * Global alert center with real-time decision triggers
 */

import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Phone,
  Repeat,
  MapPin,
  ClipboardCheck,
  AlertOctagon,
  Eye,
  UserCheck,
  UserX,
  Car,
} from "lucide-react";
import type { Alert, AlertSummary } from "../../services/alertService";

export interface AlertCenterScreenProps {
  alerts: Alert[];
  summary: AlertSummary;
  onCallWasher: (washerId: string) => void;
  onReassign: () => void;
  onVerifyGPS: (washerId: string) => void;
  onStartAudit: (washerId: string) => void;
  onEscalate: (alertId: string) => void;
  onMarkPresent: (washerId: string) => void;
  onMarkAbsent: (washerId: string) => void;
  onViewDetails: () => void;
  onResolve: (alertId: string) => void;
  onAutoAssignCars: (washerId: string) => void;
}

export function AlertCenterScreen({
  alerts,
  summary,
  onCallWasher,
  onReassign,
  onVerifyGPS,
  onStartAudit,
  onEscalate,
  onMarkPresent,
  onMarkAbsent,
  onViewDetails,
  onResolve,
  onAutoAssignCars,
}: AlertCenterScreenProps) {
  const [filter, setFilter] = useState<"all" | "critical" | "pending" | "resolved">("all");

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    if (filter === "critical") return alert.priority === "CRITICAL";
    if (filter === "pending") return alert.status === "PENDING";
    if (filter === "resolved") return alert.status === "RESOLVED";
    return true;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CALL":
        return Phone;
      case "REASSIGN":
        return Repeat;
      case "VERIFY_GPS":
        return MapPin;
      case "START_AUDIT":
        return ClipboardCheck;
      case "ESCALATE":
        return AlertOctagon;
      case "MARK_PRESENT":
        return UserCheck;
      case "MARK_ABSENT":
        return UserX;
      case "AUTO_ASSIGN_CARS":
        return Car;
      case "VIEW_DETAILS":
        return Eye;
      default:
        return AlertTriangle;
    }
  };

  const handleAction = (alert: Alert, actionType: string, washerId?: string) => {
    switch (actionType) {
      case "CALL":
        if (washerId) onCallWasher(washerId);
        break;
      case "REASSIGN":
        onReassign();
        break;
      case "VERIFY_GPS":
        if (washerId) onVerifyGPS(washerId);
        break;
      case "START_AUDIT":
        if (washerId) onStartAudit(washerId);
        break;
      case "ESCALATE":
        onEscalate(alert.id);
        break;
      case "MARK_PRESENT":
        if (washerId) onMarkPresent(washerId);
        break;
      case "MARK_ABSENT":
        if (washerId) onMarkAbsent(washerId);
        break;
      case "VIEW_DETAILS":
        onViewDetails();
        break;
      case "AUTO_ASSIGN_CARS":
        if (washerId) onAutoAssignCars(washerId);
        break;
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return {
          color: "bg-red-100 text-red-700 border-red-300",
          cardBg: "bg-red-50 border-red-300",
          label: "🔴 CRITICAL",
          mode: "Push + SMS",
        };
      case "HIGH":
        return {
          color: "bg-orange-100 text-orange-700 border-orange-300",
          cardBg: "bg-orange-50 border-orange-300",
          label: "🟠 HIGH",
          mode: "Push",
        };
      case "MEDIUM":
        return {
          color: "bg-gray-100 text-gray-700 border-gray-300",
          cardBg: "bg-gray-50 border-gray-300",
          label: "⚪ MEDIUM",
          mode: "In-App",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700 border-gray-300",
          cardBg: "bg-gray-50 border-gray-300",
          label: "UNKNOWN",
          mode: "In-App",
        };
    }
  };

  const getTimerColor = (remainingMinutes: number, deadlineMinutes: number) => {
    const ratio = remainingMinutes / deadlineMinutes;
    if (ratio > 0.5) return "text-green-600";
    if (ratio > 0.25) return "text-yellow-600";
    return "text-red-600 font-bold animate-pulse";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-red-600 to-red-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Alert Center</h1>
          <p className="text-sm text-red-100">Real-Time Decision Triggers</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-red-100">Total</p>
          </div>
          <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-2">
            <p className="text-2xl font-bold">{summary.critical}</p>
            <p className="text-xs text-red-100">Critical</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <p className="text-2xl font-bold">{summary.pendingAction}</p>
            <p className="text-xs text-red-100">Pending</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <p className="text-2xl font-bold">{summary.escalated}</p>
            <p className="text-xs text-red-100">Escalated</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* FILTER TABS */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-4">
          <TabsList className="w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="all" className="text-xs py-2">
              All ({summary.total})
            </TabsTrigger>
            <TabsTrigger value="critical" className="text-xs py-2">
              Critical ({summary.critical})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs py-2">
              Pending ({summary.pendingAction})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs py-2">
              Resolved
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ALERT LIST */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No {filter} alerts</p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => {
              const priorityConfig = getPriorityConfig(alert.priority);
              const timerColor = getTimerColor(alert.remainingMinutes, alert.responseDeadlineMinutes);

              const statusConfig = {
                PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
                ACTIONED: { label: "Actioned", color: "bg-blue-100 text-blue-700 border-blue-300" },
                ESCALATED: { label: "Escalated", color: "bg-purple-100 text-purple-700 border-purple-300" },
                RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-700 border-green-300" },
              }[alert.status];

              return (
                <Card
                  key={alert.id}
                  className={`border-2 ${priorityConfig.cardBg} ${
                    alert.priority === "CRITICAL" && alert.status === "PENDING" ? "animate-pulse" : ""
                  }`}
                >
                  <CardContent className="p-3 space-y-3">
                    {/* Row 1: Priority + Status */}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={priorityConfig.color}>
                        {priorityConfig.label}
                      </Badge>
                      <Badge variant="outline" className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Row 2: Title */}
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{alert.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                    </div>

                    {/* Row 3: Washer (if applicable) */}
                    {alert.washerName && (
                      <div className="bg-white/50 rounded p-2">
                        <p className="text-xs text-gray-600">Washer</p>
                        <p className="font-semibold text-sm text-gray-900">{alert.washerName}</p>
                        <p className="text-xs text-gray-500">{alert.washerId}</p>
                      </div>
                    )}

                    {/* Row 4: Timer */}
                    <div className="flex items-center justify-between bg-white/50 rounded p-2">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${timerColor}`} />
                        <div>
                          <p className="text-xs text-gray-600">Response Timer</p>
                          <p className={`text-sm font-bold ${timerColor}`}>
                            {alert.status === "ESCALATED"
                              ? "Auto-Escalated"
                              : alert.remainingMinutes > 0
                              ? `${alert.remainingMinutes} min remaining`
                              : "OVERDUE"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Triggered</p>
                        <p className="text-xs font-semibold text-gray-900">
                          {alert.triggeredAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Row 5: Escalation Info */}
                    {alert.status === "ESCALATED" && alert.escalatedTo && (
                      <div className="bg-purple-100 border border-purple-300 rounded p-2">
                        <p className="text-xs font-semibold text-purple-700">
                          🚨 Escalated to {alert.escalatedTo}
                        </p>
                        <p className="text-xs text-purple-600">Action required at higher level</p>
                      </div>
                    )}

                    {/* Row 6: Actions */}
                    {alert.status === "PENDING" && alert.actions.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {alert.actions.map((action) => {
                          const ActionIcon = getActionIcon(action.action);
                          return (
                            <Button
                              key={action.id}
                              size="sm"
                              variant="outline"
                              className={`h-9 text-xs ${
                                action.action === "ESCALATE"
                                  ? "border-red-300 text-red-700 hover:bg-red-50"
                                  : action.action === "CALL"
                                  ? "border-blue-300 text-blue-700 hover:bg-blue-50"
                                  : action.action === "AUTO_ASSIGN_CARS"
                                  ? "border-green-300 text-green-700 hover:bg-green-50 font-semibold"
                                  : action.action === "MARK_ABSENT"
                                  ? "border-orange-300 text-orange-700 hover:bg-orange-50 font-semibold"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                              onClick={() => handleAction(alert, action.action, action.washerId)}
                            >
                              <ActionIcon className="h-3 w-3 mr-1" />
                              {action.label}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    {/* Resolve button for actioned alerts */}
                    {alert.status === "ACTIONED" && (
                      <Button
                        size="sm"
                        className="w-full h-9 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onResolve(alert.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark Resolved
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Auto-Escalation Notice */}
        <Card className="border-2 border-yellow-300 bg-yellow-50 mt-4">
          <CardContent className="p-3 text-center">
            <p className="text-xs font-semibold text-yellow-900">
              ⚠️ Auto-Escalation Active
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Alerts automatically escalate to Ops Manager when timer expires
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sticky Alert Banner Component (for critical alerts)
export interface StickyAlertBannerProps {
  alert: Alert;
  onDismiss: () => void;
  onTakeAction: () => void;
}

export function StickyAlertBanner({ alert, onDismiss, onTakeAction }: StickyAlertBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white shadow-lg animate-pulse">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-bold text-sm">🔴 {alert.title}</p>
            <p className="text-xs text-red-100">{alert.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 bg-white text-red-600 border-0 hover:bg-red-100"
              onClick={onTakeAction}
            >
              Take Action
            </Button>
            <button
              className="text-white hover:text-red-200"
              onClick={onDismiss}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
