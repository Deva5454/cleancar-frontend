/**
 * OPERATIONS MANAGER: AUDIT TRAIL COMPONENT
 * Traceable, logged, auditable actions
 * Shows: Who, When, Why, Where (GPS for field visits)
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { User, Clock, MapPin, FileText, Eye, CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";
import type { AuditEntry, AuditSummary, AuditActionType } from "../../types/operationsManager.types";

export interface AuditTrailProps {
  entries: AuditEntry[];
  showGPS?: boolean;
  compact?: boolean;
}

export interface AuditSummaryProps {
  summary: AuditSummary;
  onViewFull: () => void;
}

const ACTION_CONFIG: Record<AuditActionType, { icon: any; colorClass: string; label: string }> = {
  APPROVAL: {
    icon: CheckCircle,
    colorClass: "bg-green-100 text-green-700 border-green-300",
    label: "Approval"
  },
  REJECTION: {
    icon: XCircle,
    colorClass: "bg-red-100 text-red-700 border-red-300",
    label: "Rejection"
  },
  VISIT: {
    icon: MapPin,
    colorClass: "bg-blue-100 text-blue-700 border-blue-300",
    label: "Field Visit"
  },
  DISCOUNT: {
    icon: FileText,
    colorClass: "bg-purple-100 text-purple-700 border-purple-300",
    label: "Discount Applied"
  },
  COMPLAINT: {
    icon: AlertCircle,
    colorClass: "bg-orange-100 text-orange-700 border-orange-300",
    label: "Complaint Handled"
  },
  PIPELINE_UPDATE: {
    icon: FileText,
    colorClass: "bg-indigo-100 text-indigo-700 border-indigo-300",
    label: "Pipeline Update"
  },
  OVERRIDE: {
    icon: Info,
    colorClass: "bg-yellow-100 text-yellow-700 border-yellow-300",
    label: "Override"
  },
  EOD_SIGNOFF: {
    icon: CheckCircle,
    colorClass: "bg-gray-100 text-gray-700 border-gray-300",
    label: "EOD Sign-off"
  }
};

function getMinutesAgo(timestamp: Date): number {
  return Math.floor((Date.now() - timestamp.getTime()) / 60000);
}

function formatTimeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function OMAuditTrail({ entries, showGPS = true, compact = false }: AuditTrailProps) {
  if (compact) {
    return (
      <div className="space-y-2">
        {entries.map((entry) => {
          const config = ACTION_CONFIG[entry.action];
          const IconComponent = config.icon;
          
          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <IconComponent className="h-5 w-5 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {entry.actionTaken}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <span>{entry.actor.name}</span>
                  <span>•</span>
                  <span>{entry.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
              <Badge className={`${config.colorClass} text-xs`} variant="outline">
                {config.label}
              </Badge>
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No audit entries available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with audit notice */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-300 rounded-lg">
        <Eye className="h-5 w-5 text-blue-600" />
        <p className="text-sm text-blue-900 font-medium">
          All actions are logged for audit & payroll processing
        </p>
      </div>

      {/* Timeline of entries */}
      <div className="space-y-3">
        {entries.map((entry) => {
          const config = ACTION_CONFIG[entry.action];
          const IconComponent = config.icon;
          const minutesAgo = getMinutesAgo(entry.timestamp);
          
          return (
            <Card key={entry.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-1">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Action Type Badge */}
                    <Badge className={`${config.colorClass} mb-2`} variant="outline">
                      {config.label}
                    </Badge>

                    {/* Action Description */}
                    <p className="text-sm font-bold text-gray-900 mb-2">
                      {entry.actionTaken}
                    </p>

                    {/* Reason (if provided) */}
                    {entry.reason && (
                      <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm text-gray-700">
                          <strong>Reason:</strong> {entry.reason}
                        </p>
                      </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {/* Actor */}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-semibold text-gray-900">{entry.actor.name}</p>
                          <p className="text-xs text-gray-600">{entry.actor.role} • ID: {entry.actor.id}</p>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {entry.timestamp.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatTimeAgo(minutesAgo)}
                          </p>
                        </div>
                      </div>

                      {/* GPS Location (if available) */}
                      {showGPS && entry.location && (
                        <div className="flex items-center gap-2 text-sm col-span-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-semibold text-gray-900">{entry.location.address}</p>
                            <p className="text-xs text-gray-600">
                              GPS: {entry.location.lat.toFixed(6)}, {entry.location.lng.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Impacted Entity */}
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {entry.impactedEntity.type}: {entry.impactedEntity.name}
                          </p>
                          <p className="text-xs text-gray-600">ID: {entry.impactedEntity.id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Metadata */}
                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <div className="p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Additional Data:</p>
                        <div className="space-y-1">
                          {Object.entries(entry.metadata).map(([key, value]) => (
                            <p key={key} className="text-xs text-gray-600">
                              <strong>{key}:</strong> {String(value)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visibility Indicator */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Eye className="h-4 w-4" />
                    <span>Visible to: City Manager, Head Office, HR, Finance</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      {entries.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p className="text-sm">No audit entries for this period</p>
        </div>
      )}
    </div>
  );
}

/**
 * COMPACT AUDIT SUMMARY (for dashboards)
 */
export function OMAuditSummary({ summary, onViewFull }: AuditSummaryProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Today's Activity Log</h3>
          <Badge className="bg-blue-600 text-white px-3 py-1">
            {summary.todayActions} actions
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <CheckCircle className="h-5 w-5 text-green-600 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{summary.approvals}</p>
            <p className="text-xs text-gray-600">Approvals</p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <XCircle className="h-5 w-5 text-red-600 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{summary.rejections}</p>
            <p className="text-xs text-gray-600">Rejections</p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <MapPin className="h-5 w-5 text-blue-600 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{summary.fieldVisits}</p>
            <p className="text-xs text-gray-600">Field Visits</p>
          </div>
        </div>

        <Button
          onClick={onViewFull}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm"
        >
          View Full Audit Trail
        </Button>

        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center gap-2 text-xs text-blue-900">
            <Eye className="h-4 w-4" />
            <span>All actions logged for audit & payroll processing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
