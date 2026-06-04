/**
 * 1️⃣ OPERATIONS MANAGER: COMMAND DASHBOARD
 * Mission control interface - Real-time territory control center
 * Philosophy: "Where am I losing units/revenue RIGHT NOW?"
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Users,
  Target,
  DollarSign,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sun,
} from "lucide-react";
import type { OMKPIs, SupervisorStatus, OMAlert } from "../../services/operationsManagerService";

export interface OMCommandDashboardProps {
  kpis: OMKPIs;
  supervisors: SupervisorStatus[];
  alerts: OMAlert[];
  onDrillDown: (metric: string) => void;
  onViewTeams: () => void;
  onOpenEscalations: () => void;
  onAlertClick: (alert: OMAlert) => void;
  timeMode?: "PERFORMANCE_REVIEW" | "FIELD_MODE" | "REVIEW_PLANNING" | "DAY_CLOSE" | "NORMAL";
}

export function OMCommandDashboard({
  kpis,
  supervisors,
  alerts,
  onDrillDown,
  onViewTeams,
  onOpenEscalations,
  onAlertClick,
  timeMode = "NORMAL",
}: OMCommandDashboardProps) {
  const criticalAlerts = alerts.filter(a => a.priority === "CRITICAL");
  const highAlerts = alerts.filter(a => a.priority === "HIGH");

  const avgUnitsPerWasher = kpis.units.done / kpis.washers.present;
  const conversionRate = 42; // Mock data - should come from service
  const retentionRate = 85; // Mock data - should come from service

  const getStatusColor = (status: SupervisorStatus["status"]) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-700 border-green-300";
      case "IDLE": return "bg-gray-100 text-gray-700 border-gray-300";
      case "ISSUES": return "bg-red-100 text-red-700 border-red-300";
    }
  };

  const getPriorityColor = (priority: OMAlert["priority"]) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-600 text-white";
      case "HIGH": return "bg-orange-500 text-white";
      case "MEDIUM": return "bg-yellow-500 text-white";
      case "LOW": return "bg-gray-400 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TIME MODE ALERT BANNER */}
      {timeMode === "PERFORMANCE_REVIEW" && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sun className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">Performance Review Mode (10:00 AM - 12:00 PM)</p>
                  <p className="text-xs text-blue-100">
                    Focus: Units vs Target • Underperformers • Pending Escalations
                  </p>
                </div>
              </div>
              {kpis.escalations.pending > 0 && (
                <Badge className="bg-red-600 text-white animate-pulse px-4 py-2">
                  ⚠️ {kpis.escalations.pending} Escalations Must Be Cleared Before 12 PM
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STICKY KPI STRIP */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Command Center</h1>
              <p className="text-sm text-slate-300">Live Territory Control</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={onViewTeams}>
                View Teams
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={`border-white/20 text-white hover:bg-white/20 ${
                  kpis.escalations.critical > 0 ? "bg-red-600 animate-pulse" : "bg-white/10"
                }`}
                onClick={onOpenEscalations}
              >
                Escalations ({kpis.escalations.count})
              </Button>
            </div>
          </div>

          {/* KPI METRICS GRID */}
          <div className="grid grid-cols-6 gap-4">
            {/* Supervisors */}
            <button
              onClick={() => onDrillDown("supervisors")}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left hover:bg-white/15 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-indigo-300" />
                <span className="text-xs text-slate-300">Supervisors</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{kpis.supervisors.present}</span>
                <span className="text-lg text-slate-300">/ {kpis.supervisors.expected}</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      kpis.supervisors.percentage >= 95 ? "bg-green-400" : kpis.supervisors.percentage >= 85 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    style={{ width: `${kpis.supervisors.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{kpis.supervisors.percentage}%</span>
              </div>
            </button>

            {/* Washers */}
            <button
              onClick={() => onDrillDown("washers")}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left hover:bg-white/15 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-blue-300" />
                <span className="text-xs text-slate-300">Washers</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{kpis.washers.present}</span>
                <span className="text-lg text-slate-300">/ {kpis.washers.expected}</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      kpis.washers.percentage >= 90 ? "bg-green-400" : kpis.washers.percentage >= 80 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    style={{ width: `${kpis.washers.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{kpis.washers.percentage}%</span>
              </div>
            </button>

            {/* Units */}
            <button
              onClick={() => onDrillDown("units")}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left hover:bg-white/15 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-purple-300" />
                <span className="text-xs text-slate-300">Units Today</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{kpis.units.done}</span>
                <span className="text-lg text-slate-300">/ {kpis.units.target}</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      kpis.units.percentage >= 90 ? "bg-green-400" : kpis.units.percentage >= 75 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    style={{ width: `${kpis.units.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{kpis.units.percentage}%</span>
              </div>
            </button>

            {/* Revenue */}
            <button
              onClick={() => onDrillDown("revenue")}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left hover:bg-white/15 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-green-300" />
                <span className="text-xs text-slate-300">Revenue MTD</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">₹{(kpis.revenue.mtd / 100000).toFixed(1)}L</span>
                <span className="text-lg text-slate-300">/ {(kpis.revenue.target / 100000).toFixed(1)}L</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      kpis.revenue.percentage >= 90 ? "bg-green-400" : kpis.revenue.percentage >= 75 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    style={{ width: `${kpis.revenue.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{kpis.revenue.percentage}%</span>
              </div>
            </button>

            {/* Escalations */}
            <button
              onClick={onOpenEscalations}
              className={`backdrop-blur-sm rounded-lg p-4 text-left transition-all ${
                kpis.escalations.critical > 0
                  ? "bg-red-600 hover:bg-red-700 animate-pulse"
                  : "bg-white/10 hover:bg-white/15"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-5 w-5 text-red-200" />
                <span className="text-xs text-slate-300">Critical Issues</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{kpis.escalations.critical}</span>
                <span className="text-lg text-slate-300">/ {kpis.escalations.count}</span>
              </div>
              <div className="mt-2 text-sm font-semibold">
                {kpis.escalations.critical > 0 ? "⚠️ REQUIRES ACTION" : "✓ All Clear"}
              </div>
            </button>

            {/* Additional Metrics */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-gray-300" />
                <span className="text-xs text-slate-300">Units per Washer</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{avgUnitsPerWasher.toFixed(2)}</span>
                <span className="text-lg text-slate-300">units</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      avgUnitsPerWasher >= 10 ? "bg-green-400" : avgUnitsPerWasher >= 5 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    style={{ width: `${Math.min(100, avgUnitsPerWasher * 10)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{avgUnitsPerWasher.toFixed(2)} units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* HOURLY UNIT PROGRESSION GRAPH */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Hourly Unit Progression by Team</h2>
                <p className="text-sm text-gray-600">Real-time vs Target • Team Breakdown with Supervisors</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>4W</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>2W</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded" />
                  <span>Add-on</span>
                </div>
              </div>
            </div>

            {/* Hourly Progression with Team Details */}
            <div className="space-y-6">
              {kpis.units.hourlyProgression.slice(-8).map((hour) => (
                <div key={hour.hour} className="border-l-4 border-indigo-500 pl-4">
                  {/* Hour Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="text-lg font-bold text-gray-900">{hour.hour}:00</div>
                      <div className="text-sm text-gray-600">
                        Total: <span className="font-semibold text-gray-900">{hour.actual}</span>
                        <span className="text-gray-400"> / {hour.target}</span>
                        <span className="ml-2 text-xs">
                          ({hour.target > 0 ? Math.round((hour.actual / hour.target) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Aggregate Bar */}
                  <div className="mb-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      {/* Target line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                        style={{ left: `${hour.target > 0 ? Math.min((hour.target / (hour.target * 1.2)) * 100, 83) : 0}%` }}
                      />
                      {/* Actual progress */}
                      <div className="flex h-full rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500"
                          style={{ width: `${hour.target > 0 ? (hour.fourW / (hour.target * 1.2)) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-green-500"
                          style={{ width: `${hour.target > 0 ? (hour.twoW / (hour.target * 1.2)) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-purple-500"
                          style={{ width: `${hour.target > 0 ? (hour.addOn / (hour.target * 1.2)) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Team Breakdown */}
                  {hour.teams && hour.teams.length > 0 && (
                    <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                      {hour.teams.filter(t => t.target > 0).map((team) => (
                        <div key={team.teamId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2 min-w-[180px]">
                              <div className={`w-2 h-2 rounded-full ${
                                team.shift === 'PART_TIME' ? 'bg-orange-400' : 'bg-purple-400'
                              }`} title={team.shift === 'PART_TIME' ? 'Part-Time (5-9 AM)' : 'Full-Time (9 AM-9 PM)'} />
                              <span className="font-medium text-gray-700 text-xs">{team.teamName}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              SUP: <span className="font-medium text-gray-700">{team.supervisorName}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {team.washersPresent}/{team.washersTotal} washers
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-4 w-32 relative">
                              <div className="flex h-full rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-500"
                                  style={{ width: `${team.target > 0 ? (team.fourW / team.target) * 100 : 0}%` }}
                                  title={`4W: ${team.fourW}`}
                                />
                                <div
                                  className="bg-green-500"
                                  style={{ width: `${team.target > 0 ? (team.twoW / team.target) * 100 : 0}%` }}
                                  title={`2W: ${team.twoW}`}
                                />
                                <div
                                  className="bg-purple-500"
                                  style={{ width: `${team.target > 0 ? (team.addOn / team.target) * 100 : 0}%` }}
                                  title={`Add-on: ${team.addOn}`}
                                />
                              </div>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <span className="font-semibold text-gray-900">{team.actual}</span>
                              <span className="text-gray-400 text-xs"> / {team.target}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SUPERVISOR STATUS CARDS */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Supervisor Status</h2>
                <Button size="sm" variant="outline" onClick={onViewTeams}>
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {supervisors.map((sup) => (
                  <div
                    key={sup.id}
                    className={`p-4 rounded-lg border-2 ${
                      sup.status === "ISSUES" ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{sup.name}</h3>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(sup.status)}`}>
                            {sup.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{sup.team}</p>
                      </div>
                      {sup.issues > 0 && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                          {sup.issues} issues
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Washers Present</p>
                        <p className="font-bold text-gray-900">
                          {sup.washers.present} / {sup.washers.total}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Units Progress</p>
                        <p className="font-bold text-gray-900">
                          {sup.units.done} / {sup.units.target}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (sup.units.done / sup.units.target) * 100 >= 85 ? "bg-green-500" : "bg-yellow-500"
                          }`}
                          style={{ width: `${Math.min(100, (sup.units.done / sup.units.target) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ALERTS PANEL */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Priority Alerts</h2>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    {criticalAlerts.length} Critical
                  </Badge>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                    {highAlerts.length} High
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {alerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => onAlertClick(alert)}
                    className={`w-full p-4 rounded-lg border-2 text-left hover:shadow-md transition-all ${
                      alert.priority === "CRITICAL"
                        ? "bg-red-50 border-red-300"
                        : alert.priority === "HIGH"
                        ? "bg-orange-50 border-orange-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={`h-5 w-5 flex-shrink-0 ${
                          alert.priority === "CRITICAL" ? "text-red-600" : "text-orange-600"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${getPriorityColor(alert.priority)}`}>
                            {alert.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.category}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">{alert.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {Math.floor((Date.now() - alert.timestamp.getTime()) / 60000)} mins ago
                          </span>
                          {alert.affectedUnits > 0 && (
                            <span className="text-red-600 font-semibold">
                              -{alert.affectedUnits} units
                            </span>
                          )}
                          {alert.affectedRevenue > 0 && (
                            <span className="text-red-600 font-semibold">
                              -₹{(alert.affectedRevenue / 1000).toFixed(1)}k
                            </span>
                          )}
                        </div>
                      </div>
                      {alert.actionRequired && (
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                            ACTION
                          </Badge>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}