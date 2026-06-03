/**
 * CM GLOBAL ALERT SYSTEM
 * System-generated alerts with auto-escalation logic
 * 
 * Philosophy: Alert → Action → Track → Escalate
 * All alerts are system-triggered, not manual
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  AlertCircle,
  TrendingDown,
  Users,
  Clock,
  Shield,
  XOctagon,
  Activity,
  Bell,
  X,
} from "lucide-react";
import type { CMAlert } from "../../types/clusterManager.types";

interface CMAlertSystemProps {
  alerts: CMAlert[];
  onDismiss: (alertId: string) => void;
  onTakeAction: (alertId: string) => void;
}

export function CMAlertSystem({ alerts, onDismiss, onTakeAction }: CMAlertSystemProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hasCriticalAlert, setHasCriticalAlert] = useState(false);

  const criticalAlerts = alerts.filter((a) => a.priority === "CRITICAL");
  const warningAlerts = alerts.filter((a) => a.priority === "WARNING");
  const infoAlerts = alerts.filter((a) => a.priority === "INFO");

  // V7: Auto-expand for critical alerts (priority override)
  if (criticalAlerts.length > 0 && !hasCriticalAlert) {
    setHasCriticalAlert(true);
    setCollapsed(false);
  }

  const getAlertIcon = (type: CMAlert["type"]) => {
    const iconMap = {
      REVENUE_DROP: TrendingDown,
      MULTI_OM_UNDERPERFORMANCE: Users,
      COMPLAINT_SLA_BREACH: Clock,
      RETENTION_CRITICAL: XOctagon,
      COMPLIANCE_FAILURE: Shield,
      HIGH_VALUE_CHURN: AlertCircle,
      KPI_FORECAST_MISS: Activity,
      ESCALATION_PENDING: Bell,
    };
    return iconMap[type];
  };

  const getEscalationColor = (level: CMAlert["escalationLevel"]) => {
    const colorMap = {
      OM: "bg-blue-600",
      CM: "bg-purple-600",
      CITY_MANAGER: "bg-red-600",
      MD: "bg-black",
    };
    return colorMap[level];
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 w-96 z-40">
      {/* Alert Counter (Collapsed View) */}
      {collapsed && (
        <Button
          onClick={() => setCollapsed(false)}
          className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
        >
          <Bell className="w-4 h-4 mr-2 animate-pulse" />
          {criticalAlerts.length} Critical Alerts
        </Button>
      )}

      {/* Alert List (Expanded View) */}
      {!collapsed && (
        <Card className="max-h-[calc(100vh-120px)] overflow-y-auto shadow-2xl border-2 border-slate-300">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-600 animate-pulse" />
              <h3 className="font-semibold text-slate-900">System Alerts</h3>
              <Badge variant="destructive">{criticalAlerts.length}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <div className="p-3 space-y-2">
              {criticalAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                return (
                  <Card
                    key={alert.id}
                    className="p-4 border-2 border-red-600 bg-red-50 shadow-md animate-pulse"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-600 rounded-lg">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-red-900 text-sm">
                            {alert.title}
                          </h4>
                          <Badge className={`${getEscalationColor(alert.escalationLevel)} text-white text-xs`}>
                            {alert.escalationLevel}
                          </Badge>
                        </div>
                        <p className="text-xs text-red-800 mb-2">
                          {alert.description}
                        </p>
                        <div className="text-xs text-red-700 mb-2">
                          <strong>Impact:</strong> {alert.impact}
                        </div>
                        {alert.autoEscalateIn && alert.autoEscalateIn > 0 && (
                          <div className="text-xs text-red-700 font-semibold mb-2">
                            ⏱️ Auto-escalates in {alert.autoEscalateIn} minutes
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onTakeAction(alert.id)}
                            className="text-xs"
                          >
                            Take Action
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDismiss(alert.id)}
                            className="text-xs"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Warning Alerts */}
          {warningAlerts.length > 0 && (
            <div className="p-3 space-y-2 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                ⚠️ WARNINGS ({warningAlerts.length})
              </div>
              {warningAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                return (
                  <Card
                    key={alert.id}
                    className="p-3 border border-amber-600 bg-amber-50"
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-amber-900 text-xs mb-1">
                          {alert.title}
                        </h4>
                        <p className="text-xs text-amber-800 mb-2">
                          {alert.description}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onTakeAction(alert.id)}
                            className="text-xs h-7"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDismiss(alert.id)}
                            className="text-xs h-7"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Info Alerts */}
          {infoAlerts.length > 0 && (
            <div className="p-3 space-y-2 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                ℹ️ INFO ({infoAlerts.length})
              </div>
              {infoAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                return (
                  <Card
                    key={alert.id}
                    className="p-3 border border-blue-300 bg-blue-50"
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-blue-900 text-xs mb-1">
                          {alert.title}
                        </h4>
                        <p className="text-xs text-blue-800">
                          {alert.description}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDismiss(alert.id)}
                          className="text-xs h-6 mt-1"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// Sample alert generator for demo
export function generateSystemAlerts(): CMAlert[] {
  return [];
}