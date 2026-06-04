/**
 * Compliance Alert Banner
 *
 * Top notification bar for critical compliance alerts
 * Shows: Policy updates, ITC risks, Payroll anomalies
 *
 * NON-DISRUPTIVE: Dismissible, auto-hides after interaction
 */

import { useState, useEffect } from "react";
import { AlertTriangle, X, ExternalLink, ChevronRight } from "lucide-react";
import { getDetectedChanges } from "../../services/compliance/aiComplianceBot";
import type { ComplianceChange } from "../../services/compliance/aiComplianceBot";
import { logger } from "../../services/logger";

export function ComplianceAlertBanner() {
  const [currentAlert, setCurrentAlert] = useState<ComplianceChange | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Get highest severity pending change
    const changes = getDetectedChanges("detected");
    const critical = changes.filter((c) => c.severity === "critical");
    const high = changes.filter((c) => c.severity === "high");

    if (critical.length > 0) {
      setCurrentAlert(critical[0]);
    } else if (high.length > 0) {
      setCurrentAlert(high[0]);
    }
  }, []);

  if (!currentAlert || dismissed) {
    return null;
  }

  const getBannerColor = () => {
    switch (currentAlert.severity) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-900";
      case "high":
        return "bg-orange-50 border-orange-200 text-orange-900";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      default:
        return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  const getIconColor = () => {
    switch (currentAlert.severity) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className={`border-b ${getBannerColor()} animate-slide-down`}>
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Alert Content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AlertTriangle className={`w-5 h-5 ${getIconColor()} flex-shrink-0`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{currentAlert.title}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                    currentAlert.severity === "critical"
                      ? "bg-red-600 text-white"
                      : currentAlert.severity === "high"
                      ? "bg-orange-600 text-white"
                      : "bg-yellow-600 text-white"
                  }`}
                >
                  {currentAlert.severity}
                </span>
              </div>
              <p className="text-xs mt-0.5 line-clamp-1">{currentAlert.description}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => (logger.log("Compliance AI bot - feature coming soon"))}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentAlert.severity === "critical"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : currentAlert.severity === "high"
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-yellow-600 text-white hover:bg-yellow-700"
              }`}
            >
              <span>Review</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {currentAlert.referenceUrl && (
              <a
                href={currentAlert.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-black hover:bg-opacity-5 rounded transition-colors"
                title="View official notification"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 hover:bg-black hover:bg-opacity-5 rounded transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar for effective date */}
        {currentAlert.effectiveFrom > new Date() && (
          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                Effective from{" "}
                {currentAlert.effectiveFrom.toLocaleDateString("en-IN", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>
                {Math.ceil(
                  (currentAlert.effectiveFrom.getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days remaining
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
