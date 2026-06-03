/**
 * Alert Modal System
 * Displays workflow alerts with different severity levels
 * Cannot be dismissed for HIGH severity until action taken
 */

import { useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  AlertCircle,
  Clock,
  Shield,
  XCircle,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import type { WorkflowAlert } from "../../types/workflowControl";

interface AlertModalProps {
  alert: WorkflowAlert;
  onDismiss: () => void;
  onAction?: () => void;
}

export function AlertModal({ alert, onDismiss, onAction }: AlertModalProps) {
  // Auto-close for low severity alerts
  useEffect(() => {
    if (alert.severity === "LOW" && alert.autoCloseAfter) {
      const timer = setTimeout(() => {
        onDismiss();
      }, alert.autoCloseAfter * 1000);
      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  const getIcon = () => {
    switch (alert.type) {
      case "FIRST_WASH_START":
        return <Clock className="w-12 h-12 text-blue-600" />;
      case "DELAY_WARNING":
        return <AlertTriangle className="w-12 h-12 text-red-600" />;
      case "COVER_UNLOCK":
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case "VALIDATION_FAILURE":
        return <XCircle className="w-12 h-12 text-red-600" />;
      case "SUPERVISOR_NOTIFICATION":
        return <Shield className="w-12 h-12 text-amber-600" />;
      case "JOB_ABANDONED":
        return <AlertCircle className="w-12 h-12 text-red-600" />;
      case "SLA_BREACH":
        return <Clock className="w-12 h-12 text-red-600" />;
      default:
        return <AlertCircle className="w-12 h-12 text-gray-600" />;
    }
  };

  const getSeverityColor = () => {
    switch (alert.severity) {
      case "HIGH":
        return "border-red-300 bg-red-50";
      case "MEDIUM":
        return "border-amber-300 bg-amber-50";
      case "LOW":
        return "border-blue-300 bg-blue-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getSeverityBadgeColor = () => {
    switch (alert.severity) {
      case "HIGH":
        return "bg-red-600";
      case "MEDIUM":
        return "bg-amber-600";
      case "LOW":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className={`max-w-md w-full border-4 ${getSeverityColor()} shadow-2xl animate-in zoom-in-95 duration-200`}>
        <CardContent className="p-6">
          {/* Close button - only for non-critical alerts */}
          {alert.severity !== "HIGH" && !alert.requiresAction && (
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Icon and Badge */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4">{getIcon()}</div>
            <Badge className={`${getSeverityBadgeColor()} mb-3`}>
              {alert.severity} PRIORITY
            </Badge>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{alert.title}</h2>
            <p className="text-gray-700 text-base">{alert.message}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {alert.requiresAction && alert.actionLabel && (
              <Button
                onClick={() => {
                  onAction?.();
                  onDismiss();
                }}
                size="lg"
                className="w-full text-lg py-6"
              >
                {alert.actionLabel || "Take Action"}
              </Button>
            )}

            {alert.severity !== "HIGH" && (
              <Button
                onClick={onDismiss}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Dismiss
              </Button>
            )}

            {alert.severity === "HIGH" && alert.requiresAction && (
              <p className="text-xs text-center text-red-700 mt-2">
                ⚠️ This alert requires action before you can proceed
              </p>
            )}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {new Date(alert.timestamp).toLocaleTimeString("en-IN")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Alert Stack Component
interface AlertStackProps {
  alerts: WorkflowAlert[];
  onDismiss: (alertId: string) => void;
  onAction?: (alertId: string) => void;
}

export function AlertStack({ alerts, onDismiss, onAction }: AlertStackProps) {
  if (alerts.length === 0) return null;

  // Show only the highest priority alert
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const currentAlert = sortedAlerts[0];

  return (
    <AlertModal
      alert={currentAlert}
      onDismiss={() => onDismiss(currentAlert.id)}
      onAction={() => onAction?.(currentAlert.id)}
    />
  );
}
