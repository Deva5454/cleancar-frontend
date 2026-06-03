/**
 * SCREEN 1: Supervisor Dashboard
 * Central command screen for daily operations
 * Alert-first design with quick navigation
 */

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Calendar,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FileCheck,
  UserPlus,
  Clock,
  MapPin,
} from "lucide-react";
import type { TeamSummary, SupervisorAlert } from "../../services/supervisorDataService";

export interface SupervisorDashboardProps {
  todayDate: Date;
  dayNumber: number;
  totalDays: number;
  summary: TeamSummary;
  alerts: SupervisorAlert[];
  currentShift: 1 | 2;
  shiftFocusAreas: string[];
  onAlertClick: (alert: SupervisorAlert) => void;
  onNavigate: (screen: string) => void;
}

export function SupervisorDashboard({
  todayDate,
  dayNumber,
  totalDays,
  summary,
  alerts,
  currentShift,
  shiftFocusAreas,
  onAlertClick,
  onNavigate,
}: SupervisorDashboardProps) {
  const unitsProgress = (summary.totalUnitsCompleted / summary.totalUnitsTarget) * 100;
  const attendanceProgress = (summary.checkedIn / (summary.totalWashers - summary.onLeave)) * 100;

  // Priority alerts (unread + critical/high)
  const priorityAlerts = alerts
    .filter(a => !a.isRead && (a.priority === "CRITICAL" || a.priority === "HIGH"))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Supervisor Control</h1>
            <p className="text-indigo-100 text-sm mt-1">
              {todayDate.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-100">Day Count</p>
            <p className="text-xl font-bold">
              {dayNumber} / {totalDays}
            </p>
          </div>
        </div>

        {/* Shift Context */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-100" />
              <span className="font-semibold">Shift {currentShift}</span>
            </div>
            <span className="text-sm text-indigo-100">
              {currentShift === 1 ? "5 AM - 9 AM" : "2 PM - 6 PM"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {shiftFocusAreas.map((area) => {
              const focusAreaMap: Record<string, string> = {
                "Lead Capture": "leads",
                "Cloth Management": "cloth",
                "Next-day Planning": "schedule",
                "Reviews": "visibility",
                "Attendance": "team",
                "Alerts": "alerts",
                "Audits": "audit",
                "Real-time Monitoring": "team"
              };
              const targetScreen = focusAreaMap[area] || "dashboard";

              return (
                <Badge
                  key={area}
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 text-xs cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => onNavigate(targetScreen)}
                >
                  {area}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Team Attendance */}
          <Card
            className="border-2 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate("team")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <Badge
                  variant="outline"
                  className={`${
                    attendanceProgress >= 90
                      ? "bg-green-50 text-green-700 border-green-300"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}
                >
                  {Math.round(attendanceProgress)}%
                </Badge>
              </div>
              <p className="text-xs text-gray-600">Team Attendance</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.checkedIn} / {summary.totalWashers}
              </p>
              {summary.late > 0 && (
                <p className="text-xs text-amber-600 mt-1">{summary.late} late</p>
              )}
            </CardContent>
          </Card>

          {/* Units Progress */}
          <Card
            className="border-2 border-green-200 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate("schedule")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-green-600" />
                <Badge
                  variant="outline"
                  className={`${
                    unitsProgress >= 75
                      ? "bg-green-50 text-green-700 border-green-300"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}
                >
                  {Math.round(unitsProgress)}%
                </Badge>
              </div>
              <p className="text-xs text-gray-600">Units Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.totalUnitsCompleted}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Target: {summary.totalUnitsTarget}
              </p>
            </CardContent>
          </Card>

          {/* Audits */}
          <Card
            className="border-2 border-purple-200 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate("audit")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <FileCheck className="h-5 w-5 text-purple-600" />
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                  {summary.auditsCompleted}/{summary.auditsCompleted + summary.auditsPending}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">Audits</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.auditsCompleted}
              </p>
              {summary.auditsPending > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {summary.auditsPending} pending
                </p>
              )}
            </CardContent>
          </Card>

          {/* Leads */}
          <Card
            className="border-2 border-teal-200 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate("leads")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="h-5 w-5 text-teal-600" />
                <TrendingUp className="h-4 w-4 text-teal-600" />
              </div>
              <p className="text-xs text-gray-600">Leads Today</p>
              <p className="text-2xl font-bold text-gray-900">{summary.leadsToday}</p>
              <p className="text-xs text-gray-600 mt-1">BTL captures</p>
            </CardContent>
          </Card>
        </div>

        {/* ALERTS PANEL - Alert-First Design */}
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Priority Alerts
              </CardTitle>
              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                {priorityAlerts.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {priorityAlerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No priority alerts</p>
              </div>
            ) : (
              priorityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onAlertClick(alert)}
                  className="p-3 bg-white rounded-lg border-2 border-red-200 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            alert.priority === "CRITICAL"
                              ? "bg-red-100 text-red-700 border-red-300"
                              : "bg-amber-100 text-amber-700 border-amber-300"
                          }`}
                        >
                          {alert.priority}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {alert.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      {alert.washerName && (
                        <p className="text-xs text-gray-600 mt-1">
                          Washer: {alert.washerName}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="ml-2">
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}

            {alerts.length > 5 && (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => onNavigate("alerts")}
              >
                View All {alerts.length} Alerts
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-16 flex-col"
              onClick={() => onNavigate("team")}
            >
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs">Team Status</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 flex-col"
              onClick={() => onNavigate("audit")}
            >
              <FileCheck className="h-5 w-5 mb-1" />
              <span className="text-xs">Start Audit</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 flex-col"
              onClick={() => onNavigate("cloth")}
            >
              <MapPin className="h-5 w-5 mb-1" />
              <span className="text-xs">Cloth Mgmt</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 flex-col"
              onClick={() => onNavigate("leads")}
            >
              <UserPlus className="h-5 w-5 mb-1" />
              <span className="text-xs">Capture Lead</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
