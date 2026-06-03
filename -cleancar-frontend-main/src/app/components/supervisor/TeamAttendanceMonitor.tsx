/**
 * SCREEN 2: Team Attendance Monitor
 * Live tracking of all washers with status indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Users,
  MapPin,
  Camera,
  Clock,
  CheckCircle,
  AlertCircle,
  UserX,
  Calendar,
  ChevronRight,
} from "lucide-react";
import type { WasherTeamMember, WasherStatus } from "../../services/supervisorDataService";

export interface TeamAttendanceMonitorProps {
  team: WasherTeamMember[];
  onViewDetails: (washerId: string) => void;
  onManualOverride: (washerId: string) => void;
  onTriggerCover: (washerId: string) => void;
}

export function TeamAttendanceMonitor({
  team,
  onViewDetails,
  onManualOverride,
  onTriggerCover,
}: TeamAttendanceMonitorProps) {
  const getStatusConfig = (status: WasherStatus) => {
    switch (status) {
      case "CHECKED_IN":
        return {
          label: "Checked In",
          color: "bg-green-100 text-green-700 border-green-300",
          icon: CheckCircle,
        };
      case "LATE":
        return {
          label: "Late",
          color: "bg-amber-100 text-amber-700 border-amber-300",
          icon: AlertCircle,
        };
      case "NOT_YET":
        return {
          label: "Not Yet",
          color: "bg-gray-100 text-gray-700 border-gray-300",
          icon: Clock,
        };
      case "LEAVE":
        return {
          label: "On Leave",
          color: "bg-blue-100 text-blue-700 border-blue-300",
          icon: Calendar,
        };
      case "WEEK_OFF":
        return {
          label: "Week Off",
          color: "bg-blue-100 text-blue-700 border-blue-300",
          icon: Calendar,
        };
      case "ABSENT":
        return {
          label: "Absent",
          color: "bg-red-100 text-red-700 border-red-300",
          icon: UserX,
        };
    }
  };

  // Group by status
  const checkedIn = team.filter((m) => m.status === "CHECKED_IN");
  const late = team.filter((m) => m.status === "LATE");
  const notYet = team.filter((m) => m.status === "NOT_YET");
  const onLeave = team.filter((m) => m.isOnLeave || m.status === "WEEK_OFF");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Team Attendance</h1>
            <p className="text-blue-100 text-sm mt-1">
              Live tracking • Max {team.length} washers
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-100" />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{checkedIn.length}</p>
            <p className="text-xs text-blue-100">Checked In</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{late.length}</p>
            <p className="text-xs text-blue-100">Late</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{notYet.length}</p>
            <p className="text-xs text-blue-100">Not Yet</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{onLeave.length}</p>
            <p className="text-xs text-blue-100">Leave</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {/* Washer List */}
        {team.map((washer) => {
          const statusConfig = getStatusConfig(washer.status);
          const StatusIcon = statusConfig.icon;
          const progressPercentage = (washer.unitsCompleted / washer.unitsTarget) * 100;

          return (
            <Card key={washer.id} className="border-2 border-gray-200">
              <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Avatar/Photo */}
                    <div className="flex-shrink-0">
                      {washer.selfieUrl ? (
                        <div className="relative">
                          <img
                            src={washer.selfieUrl}
                            alt={washer.name}
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white border-2 border-white">
                            <Camera className="h-3 w-3 text-green-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">
                            {washer.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{washer.name}</h3>
                      <p className="text-xs text-gray-600">{washer.phone}</p>
                      
                      {/* Check-in Time */}
                      {washer.checkInTime && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            {washer.checkInTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}

                      {/* Leave Type */}
                      {washer.leaveType && (
                        <p className="text-xs text-blue-600 mt-1">{washer.leaveType}</p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Progress & Indicators */}
                {washer.status === "CHECKED_IN" || washer.status === "LATE" ? (
                  <>
                    {/* Units Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Units Completed</span>
                        <span className="text-xs font-bold text-gray-900">
                          {washer.unitsCompleted} / {washer.unitsTarget}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            progressPercentage >= 60
                              ? "bg-green-500"
                              : progressPercentage >= 40
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* GPS & Selfie Indicators */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* GPS */}
                      <div className="flex items-center gap-1">
                        {washer.gpsLocation ? (
                          <>
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600">GPS Active</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">No GPS</span>
                          </>
                        )}
                      </div>

                      {/* Selfie */}
                      <div className="flex items-center gap-1">
                        {washer.selfieUrl ? (
                          <>
                            <Camera className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">No Photo</span>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : null}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onViewDetails(washer.id)}
                  >
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>

                  {washer.status === "NOT_YET" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => onManualOverride(washer.id)}
                    >
                      Manual
                    </Button>
                  )}

                  {(washer.status === "ABSENT" || washer.isOnLeave) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-teal-300 text-teal-700 hover:bg-teal-50"
                      onClick={() => onTriggerCover(washer.id)}
                    >
                      Cover
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
