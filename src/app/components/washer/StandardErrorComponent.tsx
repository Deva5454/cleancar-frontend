/**
 * Standard Error Component
 * Reusable error display for all failure scenarios
 * Design Principle: Title + Reason + Action
 */

import { AlertCircle, WifiOff, Camera, Database, RefreshCw, HelpCircle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export type ErrorType = 
  | "OFFLINE"
  | "OCR_FAILED"
  | "SYNC_FAILED"
  | "VALIDATION_FAILED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN";

export interface StandardErrorProps {
  type: ErrorType;
  title?: string;
  reason?: string;
  action?: string;
  onRetry?: () => void;
  onContact?: () => void;
  details?: string;
  canRetry?: boolean;
  canDismiss?: boolean;
  onDismiss?: () => void;
}

export function StandardErrorComponent({
  type,
  title,
  reason,
  action,
  onRetry,
  onContact,
  details,
  canRetry = true,
  canDismiss = false,
  onDismiss
}: StandardErrorProps) {
  const getErrorConfig = () => {
    switch (type) {
      case "OFFLINE":
        return {
          icon: WifiOff,
          defaultTitle: "No Internet Connection",
          defaultReason: "You are currently offline",
          defaultAction: "Check your connection and try again",
          color: "amber",
          severity: "warning"
        };
      case "OCR_FAILED":
        return {
          icon: Camera,
          defaultTitle: "Verification Failed",
          defaultReason: "Unable to verify photo details",
          defaultAction: "Retake photo with better lighting",
          color: "amber",
          severity: "warning"
        };
      case "SYNC_FAILED":
        return {
          icon: RefreshCw,
          defaultTitle: "Sync Failed",
          defaultReason: "Unable to sync data with server",
          defaultAction: "Will retry automatically",
          color: "red",
          severity: "error"
        };
      case "VALIDATION_FAILED":
        return {
          icon: AlertCircle,
          defaultTitle: "Validation Failed",
          defaultReason: "Some required information is missing or invalid",
          defaultAction: "Please check the form and try again",
          color: "red",
          severity: "error"
        };
      case "NETWORK_ERROR":
        return {
          icon: WifiOff,
          defaultTitle: "Network Error",
          defaultReason: "Unable to connect to server",
          defaultAction: "Check your internet connection",
          color: "red",
          severity: "error"
        };
      case "SERVER_ERROR":
        return {
          icon: Database,
          defaultTitle: "Server Error",
          defaultReason: "Something went wrong on our end",
          defaultAction: "Please try again in a moment",
          color: "red",
          severity: "error"
        };
      case "UNKNOWN":
      default:
        return {
          icon: HelpCircle,
          defaultTitle: "Something Went Wrong",
          defaultReason: "An unexpected error occurred",
          defaultAction: "Please try again or contact support",
          color: "red",
          severity: "error"
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayReason = reason || config.defaultReason;
  const displayAction = action || config.defaultAction;

  const colorClasses = {
    amber: {
      border: "border-amber-300",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      badge: "bg-amber-100 text-amber-700 border-amber-300"
    },
    red: {
      border: "border-red-300",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      badge: "bg-red-100 text-red-700 border-red-300"
    }
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];

  return (
    <Card className={`border-2 ${colors.border} ${colors.bg}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 rounded-full ${colors.iconBg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${colors.iconColor}`} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base font-semibold text-gray-900">
                {displayTitle}
              </h3>
              <Badge variant="outline" className={colors.badge}>
                {config.severity === "error" ? "Error" : "Warning"}
              </Badge>
            </div>

            {/* Reason */}
            <p className="text-sm text-gray-700 mb-2">
              {displayReason}
            </p>

            {/* Details (if provided) */}
            {details && (
              <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
                <p className="text-xs font-medium text-gray-900 mb-1">Details:</p>
                <p className="text-xs text-gray-700 font-mono">{details}</p>
              </div>
            )}

            {/* Action message */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
              <p className="text-xs font-medium text-gray-900 mb-1">What to do:</p>
              <p className="text-xs text-gray-700">{displayAction}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {canRetry && onRetry && (
                <Button
                  onClick={onRetry}
                  className={`w-full h-12 ${
                    config.color === "amber" 
                      ? "bg-amber-600 hover:bg-amber-700" 
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}

              {onContact && (
                <Button
                  onClick={onContact}
                  variant="outline"
                  className="w-full h-12"
                >
                  Contact Supervisor
                </Button>
              )}

              {canDismiss && onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  className="w-full h-10 text-sm"
                >
                  Dismiss
                </Button>
              )}
            </div>

            {/* Help text for specific errors */}
            {type === "OCR_FAILED" && (
              <div className="mt-3 text-xs text-gray-500">
                <p className="font-medium mb-1">Tips for better photos:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Use good lighting</li>
                  <li>Hold camera steady</li>
                  <li>Ensure clear view of number plate</li>
                  <li>Avoid glare and shadows</li>
                </ul>
              </div>
            )}

            {type === "OFFLINE" && (
              <div className="mt-3 text-xs text-gray-500 bg-white p-2 rounded border border-gray-200">
                <p><span className="font-medium">Note:</span> You can continue working offline. Data will sync automatically when connected.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
