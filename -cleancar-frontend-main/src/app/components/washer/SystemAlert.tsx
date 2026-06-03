// Global Alert System for Washer App
// Handles all system notifications, escalations, and status updates
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export type AlertType =
  | "check-in-missed"
  | "low-productivity"
  | "issue-escalated"
  | "cover-reallocation"
  | "check-out-reminder"
  | "late-check-in"
  | "incentive-blocked"
  | "anomaly-detected"
  | "auto-check-out"
  | "force-check-out"
  | "manual-attendance"
  | "incentive-override"
  | "job-reassigned"
  | "job-paused"
  | "emergency-sent"
  | "issue-submitted"
  | "issue-in-progress"
  | "schedule-updated"
  | "absence-marked"
  | "info";

export interface SystemAlertProps {
  type: AlertType;
  message?: string;
  details?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export function SystemAlert({
  type,
  message,
  details,
  dismissible = true,
  onDismiss,
  onAction,
  actionLabel,
}: SystemAlertProps) {
  const getAlertConfig = () => {
    switch (type) {
      case "check-in-missed":
        return {
          icon: <Clock className="w-5 h-5" />,
          color: "border-amber-300 bg-amber-50",
          textColor: "text-amber-900",
          iconColor: "text-amber-600",
          title: "Check-in delay detected",
          defaultMessage: "Please check in as soon as possible",
        };
      case "low-productivity":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          color: "border-red-300 bg-red-50",
          textColor: "text-red-900",
          iconColor: "text-red-600",
          title: "You are behind schedule",
          defaultMessage: "Complete pending jobs to stay on track",
        };
      case "issue-escalated":
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: "border-orange-300 bg-orange-50",
          textColor: "text-orange-900",
          iconColor: "text-orange-600",
          title: "Supervisor has been notified",
          defaultMessage: "Your issue has been escalated",
        };
      case "cover-reallocation":
      case "schedule-updated":
        return {
          icon: <Info className="w-5 h-5" />,
          color: "border-blue-300 bg-blue-50",
          textColor: "text-blue-900",
          iconColor: "text-blue-600",
          title: "Your schedule has been updated",
          defaultMessage: "Review your updated job assignments",
        };
      case "check-out-reminder":
        return {
          icon: <Clock className="w-5 h-5" />,
          color: "border-teal-300 bg-teal-50",
          textColor: "text-teal-900",
          iconColor: "text-teal-600",
          title: "Please complete check-out",
          defaultMessage: "End your shift for accurate tracking",
        };
      case "late-check-in":
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: "border-amber-300 bg-amber-50",
          textColor: "text-amber-900",
          iconColor: "text-amber-600",
          title: "Late check-in recorded",
          defaultMessage: "This may impact your attendance record",
        };
      case "incentive-blocked":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          color: "border-red-300 bg-red-50",
          textColor: "text-red-900",
          iconColor: "text-red-600",
          title: "Incentive eligibility restricted",
          defaultMessage: "Contact supervisor for details",
        };
      case "anomaly-detected":
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: "border-orange-300 bg-orange-50",
          textColor: "text-orange-900",
          iconColor: "text-orange-600",
          title: "Activity under review",
          defaultMessage: "Your recent activity is being reviewed",
        };
      case "auto-check-out":
        return {
          icon: <Info className="w-5 h-5" />,
          color: "border-blue-300 bg-blue-50",
          textColor: "text-blue-900",
          iconColor: "text-blue-600",
          title: "Auto check-out applied",
          defaultMessage: "System automatically completed your check-out",
        };
      case "force-check-out":
        return {
          icon: <Info className="w-5 h-5" />,
          color: "border-blue-300 bg-blue-50",
          textColor: "text-blue-900",
          iconColor: "text-blue-600",
          title: "Check-out completed by supervisor",
          defaultMessage: "Your shift has been ended by management",
        };
      case "manual-attendance":
        return {
          icon: <Clock className="w-5 h-5" />,
          color: "border-amber-300 bg-amber-50",
          textColor: "text-amber-900",
          iconColor: "text-amber-600",
          title: "Attendance marked by supervisor",
          defaultMessage: "Pending approval",
        };
      case "incentive-override":
        return {
          icon: <Info className="w-5 h-5" />,
          color: "border-blue-300 bg-blue-50",
          textColor: "text-blue-900",
          iconColor: "text-blue-600",
          title: "Incentive under approval",
          defaultMessage: "Your request is being processed",
        };
      case "job-reassigned":
        return {
          icon: <Info className="w-5 h-5" />,
          color: "border-blue-300 bg-blue-50",
          textColor: "text-blue-900",
          iconColor: "text-blue-600",
          title: "This job has been reassigned",
          defaultMessage: "Check your updated schedule",
        };
      case "job-paused":
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: "border-amber-300 bg-amber-50",
          textColor: "text-amber-900",
          iconColor: "text-amber-600",
          title: "This job is temporarily paused",
          defaultMessage: "Proceed with other assigned jobs",
        };
      case "emergency-sent":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: "border-green-300 bg-green-50",
          textColor: "text-green-900",
          iconColor: "text-green-600",
          title: "Help request sent to supervisor",
          defaultMessage: "Emergency assistance is on the way",
        };
      case "issue-submitted":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: "border-green-300 bg-green-50",
          textColor: "text-green-900",
          iconColor: "text-green-600",
          title: "Issue reported to supervisor",
          defaultMessage: "Your issue has been submitted",
        };
      case "issue-in-progress":
        return {
          icon: <Info className="w-5 h-5" />,
          color: "border-blue-300 bg-blue-50",
          textColor: "text-blue-900",
          iconColor: "text-blue-600",
          title: "Supervisor is reviewing",
          defaultMessage: "Your issue is being addressed",
        };
      case "absence-marked":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          color: "border-red-300 bg-red-50",
          textColor: "text-red-900",
          iconColor: "text-red-600",
          title: "Marked absent — contact supervisor",
          defaultMessage: "Immediate action required",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          color: "border-gray-300 bg-gray-50",
          textColor: "text-gray-900",
          iconColor: "text-gray-600",
          title: "System notification",
          defaultMessage: "",
        };
    }
  };

  const config = getAlertConfig();

  return (
    <Card className={`border-2 ${config.color}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${config.textColor}`}>
              {message || config.title}
            </p>
            {(details || config.defaultMessage) && (
              <p className={`text-xs mt-1 ${config.textColor} opacity-80`}>
                {details || config.defaultMessage}
              </p>
            )}
            {onAction && actionLabel && (
              <Button
                onClick={onAction}
                size="sm"
                className="mt-2 h-8"
                variant="outline"
              >
                {actionLabel}
              </Button>
            )}
          </div>
          {dismissible && onDismiss && (
            <Button
              onClick={onDismiss}
              size="icon"
              variant="ghost"
              className={`h-6 w-6 flex-shrink-0 ${config.textColor}`}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
