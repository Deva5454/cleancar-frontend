/**
 * TSM ALERT SYSTEM - Pipeline Governance Alerts
 * Real-time notifications for SLA breaches, CRM compliance, pricing issues
 *
 * Philosophy: Proactive intervention system
 * Shows: Critical/Warning/Info alerts with auto-escalation timers
 */

import { useState, useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  X,
  AlertTriangle,
  Clock,
  Info,
  Shield,
  TrendingDown,
  FileX,
  RefreshCw,
} from "lucide-react";
import type { TSMAlert } from "../../types/teleSalesManager.types";

interface TSMAlertSystemProps {
  alerts: TSMAlert[];
  onDismiss: (alertId: string) => void;
  onTakeAction: (alertId: string) => void;
}

export function TSMAlertSystem({
  alerts,
  onDismiss,
  onTakeAction,
}: TSMAlertSystemProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<TSMAlert[]>([]);
  // I2 FIX: track actual countdown per alert (was display-only, never fired)
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdowns(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id] > 0) next[id] -= 1;
        });
        return next;
      });
    }, 60000);  // decrement every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Show alerts one by one with delays to avoid overwhelming the screen
    const newAlerts = alerts.filter(
      (alert) => !visibleAlerts.find((v) => v.id === alert.id)
    );

    newAlerts.forEach((alert, index) => {
      setTimeout(() => {
        setVisibleAlerts((prev) => [...prev, alert]);
        // I2 FIX: initialise countdown when alert first appears
        if (alert.autoEscalateIn) {
          setCountdowns(prev => ({ ...prev, [alert.id]: alert.autoEscalateIn! }));
        }
      }, index * 500);
    });

    // I1 FIX: use functional update to avoid stale closure on rapid dismiss
    setVisibleAlerts((prev) =>
      prev.filter((v) => alerts.some((a) => a.id === v.id))
    );
  }, [alerts]);

  const getAlertIcon = (type: TSMAlert["type"]) => {
    switch (type) {
      case "LEAD_NOT_CALLED_10MIN":
        return Clock;
      case "CRM_NOT_UPDATED_30MIN":
        return FileX;
      case "15_ATTEMPTS_REACHED":
        return AlertTriangle;
      case "EBITDA_BREACH_ATTEMPT":
        return Shield;
      case "CONVERSION_DROP":
        return TrendingDown;
      case "RENEWAL_DROP":
        return RefreshCw;
      case "SLA_BREACH_SPIKE":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "border-red-500 bg-red-50";
      case "WARNING":
        return "border-amber-500 bg-amber-50";
      case "INFO":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-600";
      case "WARNING":
        return "bg-amber-600";
      case "INFO":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const getAlertAge = (createdAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-md">
      {visibleAlerts.slice(0, 5).map((alert) => {
        const Icon = getAlertIcon(alert.type);
        return (
          <Card
            key={alert.id}
            className={`p-4 border-2 shadow-lg animate-in slide-in-from-right-5 ${getSeverityColor(
              alert.severity
            )} ${alert.severity === "CRITICAL" ? "animate-pulse" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  alert.severity === "CRITICAL"
                    ? "bg-red-600"
                    : alert.severity === "WARNING"
                    ? "bg-amber-600"
                    : "bg-blue-600"
                }`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getSeverityBadge(alert.severity)}>
                    {alert.severity}
                  </Badge>
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-gray-900">{alert.title}</div>
                  <div className="text-sm text-gray-700">{alert.description}</div>

                  {alert.tseName && (
                    <div className="text-xs text-gray-600">
                      TSE: {alert.tseName} ({alert.tseId})
                    </div>
                  )}

                  {alert.leadId && (
                    <div className="text-xs text-gray-600">
                      Lead: {alert.leadId}
                    </div>
                  )}

                  <div className="text-xs font-medium text-gray-700 bg-white p-2 rounded border border-gray-300 mt-2">
                    Action Required: {alert.actionRequired}
                  </div>

                  {alert.autoEscalateIn && (() => {
                    // I2 FIX: real countdown that decrements
                    const remaining = countdowns[alert.id] ?? alert.autoEscalateIn;
                    return (
                      <div className={`text-xs font-medium flex items-center gap-1 ${
                        remaining <= 5 ? "text-red-700 animate-pulse" : "text-red-600"
                      }`}>
                        <Clock className="w-3 h-3" />
                        {remaining > 0
                          ? `Auto-escalates in ${remaining} min`
                          : "⚡ ESCALATION TRIGGERED — Take action now"}
                      </div>
                    );
                  })()}

                  <div className="text-xs text-gray-500">{getAlertAge(alert.createdAt)}</div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => onTakeAction(alert.id)}
                    className={
                      alert.severity === "CRITICAL"
                        ? "bg-red-600 hover:bg-red-700"
                        : alert.severity === "WARNING"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }
                  >
                    Take Action
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDismiss(alert.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {/* I3 FIX: "+X more" is now clickable to expand */}
      {visibleAlerts.length > 5 && (
        <Card className="p-3 bg-gray-100 border-gray-300 text-center cursor-pointer hover:bg-gray-200"
          onClick={() => {
            // Show all remaining alerts as a simple list
            const remaining = visibleAlerts.slice(5).map(a => `• ${a.severity}: ${a.title}`).join("\n");
            alert(`${visibleAlerts.length - 5} additional alert(s):\n${remaining}`);
          }}>
          <div className="text-sm text-blue-700 font-medium underline">
            +{visibleAlerts.length - 5} more alert
            {visibleAlerts.length - 5 > 1 ? "s" : ""} — click to view
          </div>
        </Card>
      )}
    </div>
  );
}
