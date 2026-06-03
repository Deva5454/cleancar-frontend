/**
 * SCREEN 2: Team Attendance Monitor V2 (Mission-Critical)
 * High-density operational dashboard for 5:00-5:30 AM peak window
 * Designed for speed, visibility, and instant action
 */

import { Card, CardContent } from "../ui/card";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Phone,
  MapPin,
  Camera,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  TrendingUp,
  AlertCircle as AlertCircleIcon,
  FileCheck,
  UserX,
  Repeat,
} from "lucide-react";
import type { WasherTeamMember, WasherStatus } from "../../services/supervisorDataService";
import { logger } from "../../services/logger";

export interface TeamAttendanceMonitorV2Props {
  team: WasherTeamMember[];
  currentTime: Date;
  onCallWasher: (washerId: string) => void;
  onMarkAttendance: (washerId: string) => void;
  onTriggerCover: (washerId: string) => void;
  onVerifyGPS: (washerId: string) => void;
  onViewWasher: (washerId: string) => void;
  onViewSelfie: (washerId: string, selfieUrl: string) => void;
  onRequestOverride: (washerId: string) => void;
  onSubmitIncident: (washerId: string) => void;
  onAddNote: (washerId: string) => void;
  onAutoAssignCars: (washerId: string) => void;
}

export function TeamAttendanceMonitorV2({
  team,
  currentTime,
  onCallWasher,
  onMarkAttendance,
  onTriggerCover,
  onVerifyGPS,
  onViewWasher,
  onViewSelfie,
  onRequestOverride,
  onSubmitIncident,
  onAddNote,
  onAutoAssignCars,
}: TeamAttendanceMonitorV2Props) {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Calculate summary
  const totalWashers = team.length;
  const checkedIn = team.filter((m) => m.status === "CHECKED_IN" || m.status === "LATE").length;
  const late = team.filter((m) => m.status === "LATE").length;
  const notYet = team.filter((m) => m.status === "NOT_YET").length;
  const onLeave = team.filter((m) => m.isOnLeave || m.status === "WEEK_OFF").length;

  // Critical alerts
  const criticalCount = team.filter((m) => {
    const hasGPSMismatch = false; // Would come from GPS validation
    const noCheckInBy510 = currentHour === 5 && currentMinute >= 10 && m.status === "NOT_YET";
    const auditOverdue = m.auditStatus === "OVERDUE";
    return hasGPSMismatch || noCheckInBy510 || auditOverdue;
  }).length;

  // Get alert state for washer
  const getWasherAlertState = (washer: WasherTeamMember) => {
    const alerts: string[] = [];
    const now = currentTime;
    const hour = now.getHours();
    const minute = now.getMinutes();

    // GPS mismatch (simulated)
    const hasGPSMismatch = false; // In production: check actual GPS deviation

    // Not checked in by 5:10 AM
    if (hour === 5 && minute >= 10 && washer.status === "NOT_YET") {
      alerts.push("NO_CHECKIN_510");
    }

    // GPS mismatch
    if (hasGPSMismatch && (washer.status === "CHECKED_IN" || washer.status === "LATE")) {
      alerts.push("GPS_MISMATCH");
    }

    // Audit overdue (>4 days)
    if (washer.auditStatus === "OVERDUE") {
      alerts.push("AUDIT_OVERDUE");
    }

    // Open issues (simulated)
    const hasOpenIssue = false; // In production: check actual issues

    if (hasOpenIssue) {
      alerts.push("OPEN_ISSUE");
    }

    return alerts;
  };

  // Check if washer needs action
  const needsAction = (washer: WasherTeamMember) => {
    return getWasherAlertState(washer).length > 0;
  };

  // Get status configuration
  const getStatusConfig = (status: WasherStatus) => {
    switch (status) {
      case "CHECKED_IN":
        return {
          label: "Checked In",
          color: "bg-green-100 text-green-700 border-green-300",
          dotColor: "bg-green-500",
          icon: CheckCircle,
        };
      case "LATE":
        return {
          label: "Late",
          color: "bg-amber-100 text-amber-700 border-amber-300",
          dotColor: "bg-amber-500",
          icon: AlertTriangle,
        };
      case "NOT_YET":
        return {
          label: "Not Yet",
          color: "bg-gray-100 text-gray-700 border-gray-300",
          dotColor: "bg-gray-400",
          icon: Clock,
        };
      case "LEAVE":
        return {
          label: "On Leave",
          color: "bg-blue-100 text-blue-700 border-blue-300",
          dotColor: "bg-blue-500",
          icon: Calendar,
        };
      case "WEEK_OFF":
        return {
          label: "Week Off",
          color: "bg-blue-100 text-blue-700 border-blue-300",
          dotColor: "bg-blue-500",
          icon: Calendar,
        };
      case "ABSENT":
        return {
          label: "Absent",
          color: "bg-red-100 text-red-700 border-red-300",
          dotColor: "bg-red-500",
          icon: UserX,
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-gray-200 shadow-md">
        {/* Title Bar */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Team Attendance Monitor</h1>
              <p className="text-xs text-gray-600">
                Live tracking • {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {criticalCount > 0 && (
              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 animate-pulse">
                {criticalCount} Action Required
              </Badge>
            )}
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="px-4 py-2 bg-gray-50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Total */}
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{totalWashers}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>

            {/* Checked In */}
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{checkedIn}</p>
              <p className="text-xs text-gray-600">Checked In</p>
            </div>

            {/* Late */}
            <div className="text-center">
              <p className="text-xl font-bold text-amber-600">{late}</p>
              <p className="text-xs text-gray-600">Late</p>
            </div>

            {/* Not Yet */}
            <div className="text-center">
              <p className="text-xl font-bold text-red-600">{notYet}</p>
              <p className="text-xs text-gray-600">Not Yet</p>
            </div>
          </div>
        </div>
      </div>

      {/* WASHER LIST */}
      <div className="px-4 py-3 space-y-2">
        {team.map((washer, index) => {
          const statusConfig = getStatusConfig(washer.status);
          const StatusIcon = statusConfig.icon;
          const alerts = getWasherAlertState(washer);
          const hasAlerts = alerts.length > 0;
          const progressPercentage = (washer.unitsCompleted / washer.unitsTarget) * 100;
          const incentiveUnits = washer.unitsCompleted > 25 ? washer.unitsCompleted - 25 : 0;

          // Calculate days since last audit
          const daysSinceAudit = washer.lastAuditDate
            ? Math.floor((currentTime.getTime() - washer.lastAuditDate.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          // Simulated: consecutive late days (would come from service)
          const consecutiveLateDays = washer.status === "LATE" ? Math.floor(Math.random() * 4) : 0;

          return (
            <Card
              key={washer.id}
              className={`border-2 ${
                hasAlerts ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
              } hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-3">
                {/* ROW 1: Primary Info + Status */}
                <div className="flex items-start justify-between mb-2">
                  {/* Left: Name + ID */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {washer.selfieUrl ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onViewSelfie(washer.id, washer.selfieUrl!);
                          }}
                          className="relative cursor-pointer hover:opacity-80 transition-opacity"
                          aria-label="View selfie"
                          type="button"
                        >
                          <img
                            src={washer.selfieUrl}
                            alt={washer.name}
                            className="h-10 w-10 rounded-full object-cover border-2 border-gray-300"
                          />
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white border-2 border-white">
                            <Camera className="h-3 w-3 text-green-600" />
                          </div>
                        </button>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-600">
                            {washer.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onViewWasher(washer.id);
                      }}
                      className="flex-1 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
                      type="button"
                    >
                      <p className="font-bold text-gray-900 truncate">{washer.name}</p>
                      <p className="text-xs text-gray-600">{washer.id}</p>
                    </button>
                  </div>

                  {/* Right: Status Block (VISUAL DOMINANCE) */}
                  <div className="flex items-center gap-2 ml-2">
                    <div className={`h-3 w-3 rounded-full ${statusConfig.dotColor} animate-pulse`} />
                    <div className="text-right">
                      <Badge variant="outline" className={`${statusConfig.color} text-xs whitespace-nowrap`}>
                        {statusConfig.label}
                      </Badge>
                      {washer.checkInTime && (
                        <p className="text-xs font-semibold text-gray-900 mt-1">
                          {washer.checkInTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ROW 2: Validation Indicators */}
                {(washer.status === "CHECKED_IN" || washer.status === "LATE") && (
                  <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-200">
                    {/* GPS */}
                    <div className="flex items-center gap-1">
                      {washer.gpsLocation ? (
                        <>
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">GPS ✓</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">GPS ✗</span>
                        </>
                      )}
                    </div>

                    {/* Selfie */}
                    <div className="flex items-center gap-1">
                      {washer.selfieUrl ? (
                        <>
                          <Camera className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Photo ✓</span>
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">Photo ✗</span>
                        </>
                      )}
                    </div>

                    {/* Live Status */}
                    <div className="flex-1 text-right">
                      {washer.unitsCompleted > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                          Washing Car {washer.unitsCompleted + 1}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* ROW 3: Performance Metrics */}
                {washer.status === "CHECKED_IN" || washer.status === "LATE" ? (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Units Completed</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">
                          {washer.unitsCompleted.toFixed(1)} / {washer.unitsTarget.toFixed(1)}
                        </span>
                        {incentiveUnits > 0 && (
                          <span className="text-xs text-green-600 ml-2">+{incentiveUnits.toFixed(1)} incentive</span>
                        )}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progressPercentage >= 80
                            ? "bg-green-500"
                            : progressPercentage >= 60
                            ? "bg-blue-500"
                            : progressPercentage >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                {/* ROW 4: Compliance Flags */}
                <div className="flex items-center gap-2 mb-2 text-xs">
                  {/* Audit Status */}
                  <div className="flex items-center gap-1">
                    <FileCheck className={`h-3 w-3 ${daysSinceAudit >= 4 ? "text-red-600" : "text-gray-500"}`} />
                    <span className={daysSinceAudit >= 4 ? "text-red-600 font-semibold" : "text-gray-600"}>
                      {washer.lastAuditDate ? `${daysSinceAudit}d ago` : "No audit"}
                    </span>
                  </div>

                  {/* Open Issues */}
                  <div className="flex items-center gap-1">
                    <AlertCircleIcon className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">0 issues</span>
                  </div>

                  {/* Late Streak Warning */}
                  {consecutiveLateDays >= 3 && (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs ml-auto">
                      ⚠️ 3 Late Days • ½ Day Deduction
                    </Badge>
                  )}
                </div>

                {/* ALERT BANNERS */}
                {alerts.length > 0 && (
                  <div className="space-y-1 mb-2 relative z-10">
                    {alerts.includes("NO_CHECKIN_510") && (
                      <div className="bg-red-100 border border-red-300 rounded px-2 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-red-700">🔴 No Check-In by 5:10 AM</span>
                          <Badge variant="outline" className="bg-red-200 text-red-800 border-red-400 text-xs">
                            CRITICAL
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] flex-1 text-xs border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onCallWasher(washer.id);
                            }}
                            type="button"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call Washer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] flex-1 text-xs border-red-300 text-red-700 hover:bg-red-50 cursor-pointer font-semibold"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onAutoAssignCars(washer.id);
                            }}
                            type="button"
                          >
                            <Repeat className="h-3 w-3 mr-1" />
                            Auto-Assign Cars
                          </Button>
                        </div>
                      </div>
                    )}

                    {alerts.includes("GPS_MISMATCH") && (
                      <div className="bg-red-100 border border-red-300 rounded px-2 py-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-red-700">🔴 GPS Mismatch (&gt;100m)</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onVerifyGPS(washer.id);
                          }}
                          type="button"
                        >
                          Verify
                        </Button>
                      </div>
                    )}

                    {alerts.includes("AUDIT_OVERDUE") && (
                      <div className="bg-red-100 border border-red-300 rounded px-2 py-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-red-700">🔴 Audit Overdue ({daysSinceAudit}d)</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            logger.log("Start audit:", washer.id);
                            if (typeof window !== 'undefined') {
                              toast.info(`Starting audit for washer ${washer.id}\n\nIn production: This would navigate to the audit screen.`);
                            }
                          }}
                          type="button"
                        >
                          Audit
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ROW ACTIONS - Ensure clickability with explicit z-index and pointer events */}
                <div className="flex flex-wrap gap-2 relative z-10">
                  {/* Call Washer */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px] flex-1 flex items-center justify-center gap-1 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCallWasher(washer.id);
                    }}
                    type="button"
                  >
                    <Phone className="h-3 w-3" />
                    <span className="text-xs">Call</span>
                  </Button>

                  {/* Mark Attendance (if not checked in) */}
                  {washer.status === "NOT_YET" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] flex-1 flex items-center justify-center gap-1 border-green-300 text-green-700 hover:bg-green-50 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMarkAttendance(washer.id);
                      }}
                      type="button"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs">Mark</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] flex-1 flex items-center justify-center gap-1 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onViewWasher(washer.id);
                      }}
                      type="button"
                    >
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">View</span>
                    </Button>
                  )}

                  {/* Cover / Override / Action */}
                  {washer.status === "ABSENT" || washer.isOnLeave ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] flex-1 flex items-center justify-center gap-1 border-teal-300 text-teal-700 hover:bg-teal-50 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onTriggerCover(washer.id);
                      }}
                      type="button"
                    >
                      <Repeat className="h-3 w-3" />
                      <span className="text-xs">Cover</span>
                    </Button>
                  ) : washer.status === "NOT_YET" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] flex-1 flex items-center justify-center gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRequestOverride(washer.id);
                      }}
                      type="button"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs">Override</span>
                    </Button>
                  ) : consecutiveLateDays >= 3 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] flex-1 flex items-center justify-center gap-1 border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddNote(washer.id);
                      }}
                      type="button"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs">Note</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] flex-1 flex items-center justify-center gap-1 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onViewWasher(washer.id);
                      }}
                      type="button"
                    >
                      <span className="text-xs">Details</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}