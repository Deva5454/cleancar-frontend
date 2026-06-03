/**
 * MODULE 8: Visibility & Management Hierarchy
 * Shows what data is visible to each management level
 */

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Eye,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  ClipboardCheck,
  Package,
  DollarSign,
  Award,
} from "lucide-react";
import type {
  SupervisorPerformanceData,
  DataVisibility,
  HierarchyView,
  KPIComparison,
  EscalationVisibility,
} from "../../services/hierarchyVisibilityService";

export interface HierarchyVisibilityScreenProps {
  performanceData: SupervisorPerformanceData;
  dataVisibilityMap: DataVisibility[];
  hierarchyViews: HierarchyView[];
  kpiComparison: KPIComparison[];
  escalationVisibility: EscalationVisibility;
}

export function HierarchyVisibilityScreen({
  performanceData,
  dataVisibilityMap,
  hierarchyViews,
  kpiComparison,
  escalationVisibility,
}: HierarchyVisibilityScreenProps) {
  const { attendance, unitsDone, auditScores, clothStatus, leads, retention, incentives, kpi } =
    performanceData;

  const kpiStatusConfig = {
    EXCELLENT: { color: "bg-green-100 text-green-700 border-green-300", label: "Excellent" },
    GOOD: { color: "bg-blue-100 text-blue-700 border-blue-300", label: "Good" },
    WARNING: { color: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "Warning" },
    CRITICAL: { color: "bg-red-100 text-red-700 border-red-300", label: "Critical" },
  }[kpi.status];

  const getVisibilityIcon = (level: string) => {
    switch (level) {
      case "FULL":
        return "✓";
      case "SUMMARY":
        return "◐";
      case "AGGREGATE":
        return "▢";
      case "NONE":
        return "✗";
      default:
        return "?";
    }
  };

  const getVisibilityColor = (level: string) => {
    switch (level) {
      case "FULL":
        return "text-green-600";
      case "SUMMARY":
        return "text-blue-600";
      case "AGGREGATE":
        return "text-gray-600";
      case "NONE":
        return "text-red-600";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-purple-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Performance & Visibility</h1>
          <p className="text-sm text-purple-100">Management Hierarchy Transparency</p>
        </div>

        {/* KPI Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-100">Overall KPI Score</p>
              <p className="text-3xl font-bold">{kpi.score}/100</p>
              <p className="text-xs text-purple-100">Threshold: {kpi.threshold}</p>
            </div>
            <Badge variant="outline" className={`${kpiStatusConfig.color} text-lg px-4 py-2`}>
              {kpiStatusConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* SECTION 1: YOUR DATA (SUPERVISOR VIEW) */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-3 bg-blue-50">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Your Data (Supervisor View)
            </CardTitle>
            <p className="text-xs text-gray-600">What you can see and manage</p>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {/* Attendance */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Team Attendance</span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  {attendance.percentage}%
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {attendance.present}/{attendance.total} washers present
              </p>
            </div>

            {/* Units */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900">Units Done vs Target</span>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  {unitsDone.percentage}%
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {unitsDone.completed}/{unitsDone.target} units completed
              </p>
            </div>

            {/* Audits */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-900">Audit Scores</span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  {auditScores.average}/5
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {auditScores.todayCount}/{auditScores.target} audits today
              </p>
            </div>

            {/* Cloth */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-gray-900">Cloth Status</span>
                </div>
                {clothStatus.overdueCollections > 0 ? (
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    {clothStatus.overdueCollections} Overdue
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    On Track
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600">{clothStatus.activeWashers} active batches</p>
            </div>

            {/* Leads */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-gray-900">Leads + Conversion</span>
                </div>
                <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300">
                  {leads.conversionRate.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {leads.converted}/{leads.total} converted
              </p>
            </div>

            {/* Retention */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-semibold text-gray-900">Retention</span>
                </div>
                <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-300">
                  {retention.rate}%
                </Badge>
              </div>
              <p className="text-xs text-gray-600">{retention.activeCustomers} active customers</p>
            </div>

            {/* Incentives */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-900">Incentives</span>
                </div>
                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300">
                  ₹{incentives.month}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                Earned: ₹{incentives.earned} | Pending: ₹{incentives.pending}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: HOW YOU ARE VIEWED (HIERARCHY VIEW) */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3 bg-purple-50">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              How You Are Viewed
            </CardTitle>
            <p className="text-xs text-gray-600">Management hierarchy visibility</p>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            {hierarchyViews.map((view) => {
              const colorClasses = {
                blue: "bg-blue-50 border-blue-200",
                purple: "bg-purple-50 border-purple-200",
                emerald: "bg-emerald-50 border-emerald-200",
              }[view.color];

              const badgeClasses = {
                blue: "bg-blue-100 text-blue-700 border-blue-300",
                purple: "bg-purple-100 text-purple-700 border-purple-300",
                emerald: "bg-emerald-100 text-emerald-700 border-emerald-300",
              }[view.color];

              return (
                <div key={view.role} className={`border-2 rounded-lg p-3 ${colorClasses}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-gray-900">{view.label}</h4>
                    <Badge variant="outline" className={badgeClasses}>
                      {view.viewType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {view.canSee.map((item, idx) => (
                      <p key={idx} className="text-xs text-gray-700">
                        • {item}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* DATA VISIBILITY MAPPING */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data Visibility Matrix</CardTitle>
            <p className="text-xs text-gray-600">Who can see what data</p>
          </CardHeader>
          <CardContent className="p-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Data</th>
                    <th className="text-center py-2 px-2 font-semibold text-blue-700">Sup</th>
                    <th className="text-center py-2 px-2 font-semibold text-purple-700">Ops</th>
                    <th className="text-center py-2 px-2 font-semibold text-emerald-700">City</th>
                  </tr>
                </thead>
                <tbody>
                  {dataVisibilityMap.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-2 px-2 text-gray-900">{row.dataPoint}</td>
                      <td
                        className={`text-center py-2 px-2 font-semibold ${getVisibilityColor(
                          row.supervisor
                        )}`}
                      >
                        {getVisibilityIcon(row.supervisor)}
                      </td>
                      <td
                        className={`text-center py-2 px-2 font-semibold ${getVisibilityColor(
                          row.opsManager
                        )}`}
                      >
                        {getVisibilityIcon(row.opsManager)}
                      </td>
                      <td
                        className={`text-center py-2 px-2 font-semibold ${getVisibilityColor(
                          row.cityManager
                        )}`}
                      >
                        {getVisibilityIcon(row.cityManager)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-green-600 font-semibold">✓</span>
                <span className="text-gray-600">Full</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-600 font-semibold">◐</span>
                <span className="text-gray-600">Summary</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600 font-semibold">▢</span>
                <span className="text-gray-600">Aggregate</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-red-600 font-semibold">✗</span>
                <span className="text-gray-600">None</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI COMPARISON */}
        <Card className="border-2 border-indigo-200">
          <CardHeader className="pb-3 bg-indigo-50">
            <CardTitle className="text-base">KPI Comparison</CardTitle>
            <p className="text-xs text-gray-600">Your performance vs team & city averages</p>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            {kpiComparison.map((comp) => (
              <div key={comp.metric} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{comp.metric}</span>
                  {comp.rank && (
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300">
                      Rank {comp.rank}/{comp.totalSupervisors}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-600">You</p>
                    <p className="text-sm font-bold text-blue-700">{comp.supervisorValue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Team Avg</p>
                    <p className="text-sm font-bold text-purple-700">{comp.teamAverage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">City Avg</p>
                    <p className="text-sm font-bold text-emerald-700">{comp.cityAverage}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ESCALATION VISIBILITY */}
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Escalation Visibility
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Active Escalations: {escalationVisibility.activeEscalations}
              </p>

              {escalationVisibility.visibleToOpsManager && (
                <div className="mb-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    ✓ Visible to Ops Manager
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">
                    Your escalations visible to Ops Manager in real-time
                  </p>
                </div>
              )}

              {escalationVisibility.visibleToCityManager && (
                <div>
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    ⚠️ Visible to City Manager
                  </Badge>
                  <p className="text-xs text-red-700 font-semibold mt-1">
                    {escalationVisibility.escalationWarning}
                  </p>
                </div>
              )}

              {!escalationVisibility.visibleToOpsManager && (
                <p className="text-xs text-green-700">No active escalations</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notice */}
        <Card className="border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-3 text-center">
            <p className="text-xs font-semibold text-gray-700">
              ℹ️ This screen is for transparency only — No actions available
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
