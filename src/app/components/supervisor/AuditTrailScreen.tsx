/**
 * MODULE 9: Audit Trail Screen
 * View-only activity log with full traceability
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  Package,
  AlertTriangle,
  MapPin,
  Clock,
  Lock,
} from "lucide-react";
import type { AuditLogEntry, AuditTrailSummary, ActionCategory } from "../../services/auditTrailService";

export interface AuditTrailScreenProps {
  logs: AuditLogEntry[];
  summary: AuditTrailSummary;
}

export function AuditTrailScreen({ logs, summary }: AuditTrailScreenProps) {
  const [filter, setFilter] = useState<ActionCategory | "ALL">("ALL");

  const filteredLogs = filter === "ALL" ? logs : logs.filter((log) => log.category === filter);

  const getCategoryIcon = (category: ActionCategory) => {
    switch (category) {
      case "ATTENDANCE":
        return Users;
      case "AUDIT":
        return ClipboardCheck;
      case "LEAD":
        return TrendingUp;
      case "CLOTH":
        return Package;
      case "ESCALATION":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getCategoryColor = (category: ActionCategory) => {
    switch (category) {
      case "ATTENDANCE":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "AUDIT":
        return "bg-green-100 text-green-700 border-green-300";
      case "LEAD":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "CLOTH":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "ESCALATION":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getGPSStatusBadge = (status?: string) => {
    if (!status || status === "NOT_REQUIRED") return null;

    const config = {
      VERIFIED: { label: "GPS ✓", color: "bg-green-100 text-green-700 border-green-300" },
      MISMATCH: { label: "GPS ✗", color: "bg-red-100 text-red-700 border-red-300" },
    }[status];

    if (!config) return null;

    return (
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Activity Log</h1>
          <p className="text-sm text-indigo-100">Complete Audit Trail</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-indigo-100">Total Logs</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <p className="text-2xl font-bold">{summary.todayLogs}</p>
            <p className="text-xs text-indigo-100">Today</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-xs text-indigo-100">Filtered</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* FILTER TABS */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-4">
          <TabsList className="w-full grid grid-cols-3 h-auto">
            <TabsTrigger value="ALL" className="text-xs py-2">
              All ({summary.total})
            </TabsTrigger>
            <TabsTrigger value="ATTENDANCE" className="text-xs py-2">
              Attendance ({summary.attendance})
            </TabsTrigger>
            <TabsTrigger value="AUDIT" className="text-xs py-2">
              Audits ({summary.audits})
            </TabsTrigger>
          </TabsList>
          <TabsList className="w-full grid grid-cols-3 h-auto mt-2">
            <TabsTrigger value="LEAD" className="text-xs py-2">
              Leads ({summary.leads})
            </TabsTrigger>
            <TabsTrigger value="CLOTH" className="text-xs py-2">
              Cloth ({summary.cloth})
            </TabsTrigger>
            <TabsTrigger value="ESCALATION" className="text-xs py-2">
              Escalations ({summary.escalations})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* LOG LIST */}
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No {filter.toLowerCase()} logs found</p>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => {
              const CategoryIcon = getCategoryIcon(log.category);
              const categoryColor = getCategoryColor(log.category);

              return (
                <Card key={log.id} className="border border-gray-300">
                  <CardContent className="p-3">
                    {/* Row 1: Category + Locked */}
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={categoryColor}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {log.category}
                      </Badge>
                      {log.locked && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>

                    {/* Row 2: Action Title */}
                    <h3 className="font-bold text-sm text-gray-900 mb-1">{log.action}</h3>
                    <p className="text-xs text-gray-600 mb-2">{log.entity}</p>

                    {/* Row 3: Timestamp + GPS */}
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{log.timestamp.toLocaleString()}</span>
                      </div>
                      {getGPSStatusBadge(log.gpsStatus)}
                    </div>

                    {/* Row 4: Outcome */}
                    <div className="bg-gray-50 rounded p-2 border border-gray-200">
                      <p className="text-xs text-gray-600">Outcome</p>
                      <p className="text-xs font-semibold text-gray-900">{log.outcome}</p>
                    </div>

                    {/* Row 5: GPS Location (if available) */}
                    {log.gpsLocation && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {log.gpsLocation.lat.toFixed(4)}, {log.gpsLocation.lng.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Notice */}
        <Card className="border-2 border-gray-300 bg-gray-50 mt-4">
          <CardContent className="p-3 text-center">
            <p className="text-xs font-semibold text-gray-700">
              🔒 All logs are immutable — No edits allowed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Action Confirmation Toast/Card Component
export interface ActionConfirmationProps {
  title: string;
  message: string;
  timestamp: Date;
  gpsVerified?: boolean;
  linkedEntity: string;
  icon: "success" | "warning" | "info";
  onDismiss: () => void;
}

export function ActionConfirmation({
  title,
  message,
  timestamp,
  gpsVerified,
  linkedEntity,
  icon,
  onDismiss,
}: ActionConfirmationProps) {
  const iconConfig = {
    success: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700" },
    warning: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" },
    info: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
  }[icon];

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-[60] ${iconConfig.bg} border-2 ${iconConfig.border} rounded-lg shadow-lg animate-slide-up`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-bold text-sm ${iconConfig.text}`}>{title}</h3>
          <button
            className={`${iconConfig.text} hover:opacity-70`}
            onClick={onDismiss}
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-gray-700 mb-2">{message}</p>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{timestamp.toLocaleTimeString()}</span>
          {gpsVerified !== undefined && (
            <Badge
              variant="outline"
              className={
                gpsVerified
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-red-100 text-red-700 border-red-300"
              }
            >
              {gpsVerified ? "GPS ✓" : "GPS ✗"}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
