/**
 * Compliance Status Badge
 *
 * Visual indicator for payroll compliance status
 * Shows: 🟢 Compliant | 🟡 Warning | 🔴 Non-compliant
 *
 * Usage:
 * <ComplianceStatusBadge status={complianceStatus} />
 */

import type { ComplianceStatus } from "../../services/payroll/complianceEngine";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface ComplianceStatusBadgeProps {
  status: ComplianceStatus;
  showDetails?: boolean;
}

export function ComplianceStatusBadge({
  status,
  showDetails = false,
}: ComplianceStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status.status) {
      case "compliant":
        return {
          icon: CheckCircle,
          label: "Compliant",
          className: "bg-green-50 text-green-700 border-green-200",
          iconClassName: "text-green-500",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          label: "Warning",
          className: "bg-yellow-50 text-yellow-700 border-yellow-200",
          iconClassName: "text-yellow-500",
        };
      case "non-compliant":
        return {
          icon: AlertCircle,
          label: "Non-Compliant",
          className: "bg-red-50 text-red-700 border-red-200",
          iconClassName: "text-red-500",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.className}`}
      >
        <Icon className={`w-4 h-4 ${config.iconClassName}`} />
        <span className="text-sm font-medium">{config.label}</span>
      </div>

      {/* Details (errors/warnings) */}
      {showDetails && (status.errors.length > 0 || status.warnings.length > 0) && (
        <div className="space-y-2">
          {status.errors.length > 0 && (
            <div className="space-y-1">
              {status.errors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-red-600"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {status.warnings.length > 0 && (
            <div className="space-y-1">
              {status.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-yellow-600"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
