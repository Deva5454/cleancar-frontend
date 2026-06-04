/**
 * CLUSTER COMMAND DASHBOARD
 * Home screen - Real-time cluster health snapshot
 * KPI-first design with exception-based alerts
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  Target,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { ClusterKPIs, ClusterSummary, OMPerformanceCard } from "../../types/clusterManager.types";
import { HEALTH_STATUS } from "../../constants/clusterManager.constants";

interface CMCommandDashboardProps {
  kpis: ClusterKPIs;
  summary: ClusterSummary;
  omCards: OMPerformanceCard[];
  onOMClick: (omId: string) => void;
  onOpenEscalations: () => void;
}

export function CMCommandDashboard({
  kpis,
  summary,
  omCards,
  onOMClick,
  onOpenEscalations,
}: CMCommandDashboardProps) {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 95) return "text-green-600";
    if (percentage >= 80) return "text-amber-600";
    return "text-red-600";
  };

  const getStatusBg = (percentage: number) => {
    if (percentage >= 95) return "bg-green-50 border-green-200";
    if (percentage >= 80) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6">
      {/* Cluster Summary Widgets */}
      <div className="grid grid-cols-5 gap-4">
        {/* Revenue */}
        <Card className={`p-4 border ${getStatusBg(kpis.revenue.percentage)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                Revenue MTD
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(kpis.revenue.percentage)}`}>
                ₹{(kpis.revenue.mtd / 100000).toFixed(1)}L
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Target: ₹{(kpis.revenue.target / 100000).toFixed(1)}L
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${getStatusColor(kpis.revenue.percentage)} bg-transparent border-0`}>
                {kpis.revenue.percentage.toFixed(1)}%
              </Badge>
              {kpis.revenue.trend === "UP" ? (
                <TrendingUp className="w-4 h-4 text-green-600 mt-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mt-1" />
              )}
            </div>
          </div>
        </Card>

        {/* Unit Productivity */}
        <Card className={`p-4 border ${getStatusBg(kpis.unitProductivity.percentage)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                <Target className="w-3.5 h-3.5" />
                Units per Washer
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(kpis.unitProductivity.percentage)}`}>
                {kpis.unitProductivity.avgPerWasher.toFixed(1)}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Target: {kpis.unitProductivity.target}
              </div>
            </div>
            <Badge className={`${getStatusColor(kpis.unitProductivity.percentage)} bg-transparent border-0`}>
              {kpis.unitProductivity.percentage.toFixed(1)}%
            </Badge>
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className={`p-4 border ${getStatusBg(kpis.conversion.percentage)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                <Activity className="w-3.5 h-3.5" />
                Conversion Rate
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(kpis.conversion.percentage)}`}>
                {kpis.conversion.rate.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Target: {kpis.conversion.target}%
              </div>
            </div>
            <Badge className={`${getStatusColor(kpis.conversion.percentage)} bg-transparent border-0`}>
              {kpis.conversion.percentage.toFixed(1)}%
            </Badge>
          </div>
        </Card>

        {/* Retention Rate */}
        <Card className={`p-4 border ${getStatusBg(kpis.retention.percentage)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Retention Rate
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(kpis.retention.percentage)}`}>
                {kpis.retention.rate.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Target: {kpis.retention.target}%
              </div>
            </div>
            <Badge className={`${getStatusColor(kpis.retention.percentage)} bg-transparent border-0`}>
              {kpis.retention.percentage.toFixed(1)}%
            </Badge>
          </div>
        </Card>

        {/* Escalations */}
        <Card
          className={`p-4 border cursor-pointer hover:shadow-md transition-shadow ${
            kpis.openEscalations.critical > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
          }`}
          onClick={onOpenEscalations}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Open Escalations
              </div>
              <div className={`text-2xl font-bold ${kpis.openEscalations.critical > 0 ? "text-red-600" : "text-slate-900"}`}>
                {kpis.openEscalations.total}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {kpis.openEscalations.critical} Critical • {kpis.openEscalations.overdue} Overdue
              </div>
            </div>
            <Badge variant="destructive" className="h-6">
              {kpis.openEscalations.critical}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Additional Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border border-slate-200">
          <div className="text-xs text-slate-600 mb-2">Total Units Today</div>
          <div className="text-xl font-bold text-slate-900">
            {summary.totalUnitsToday.total.toLocaleString()}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-600">
            <span>4W: {summary.totalUnitsToday.fourW.toLocaleString()}</span>
            <span>2W: {summary.totalUnitsToday.twoW.toLocaleString()}</span>
            <span>Add-on: {summary.totalUnitsToday.addOn.toLocaleString()}</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Target: {summary.totalUnitsToday.target.toLocaleString()} (
            {((summary.totalUnitsToday.total / summary.totalUnitsToday.target) * 100).toFixed(1)}%)
          </div>
        </Card>

        <Card className="p-4 border border-slate-200">
          <div className="text-xs text-slate-600 mb-2">Active Supervisors</div>
          <div className="text-xl font-bold text-slate-900">
            {summary.supervisorsActive.present} / {summary.supervisorsActive.expected}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div
                className="bg-indigo-600 rounded-full h-2"
                style={{ width: `${summary.supervisorsActive.percentage}%` }}
              />
            </div>
            <span className="text-xs text-slate-600">{summary.supervisorsActive.percentage.toFixed(1)}%</span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200">
          <div className="text-xs text-slate-600 mb-2">Active Washers</div>
          <div className="text-xl font-bold text-slate-900">
            {summary.washersActive.present} / {summary.washersActive.expected}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 rounded-full h-2"
                style={{ width: `${summary.washersActive.percentage}%` }}
              />
            </div>
            <span className="text-xs text-slate-600">{summary.washersActive.percentage.toFixed(1)}%</span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200">
          <div className="text-xs text-slate-600 mb-2">Customer Growth</div>
          <div className="text-xl font-bold text-slate-900">{kpis.activeCustomers.current}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              +{kpis.activeCustomers.change} vs Last Month
            </Badge>
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Churn Risk: {kpis.churnRisk.high} High • {kpis.churnRisk.medium} Medium
          </div>
        </Card>
      </div>

      {/* OM Performance Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Operations Managers</h2>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1.5">
              <div className={`w-2 h-2 rounded-full ${HEALTH_STATUS.GREEN.dotColor}`} />
              {omCards.filter((om) => om.overallHealth === "GREEN").length} Healthy
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <div className={`w-2 h-2 rounded-full ${HEALTH_STATUS.AMBER.dotColor}`} />
              {omCards.filter((om) => om.overallHealth === "AMBER").length} At Risk
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <div className={`w-2 h-2 rounded-full ${HEALTH_STATUS.RED.dotColor}`} />
              {omCards.filter((om) => om.overallHealth === "RED").length} Critical
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {omCards.map((om) => {
            const healthConfig = HEALTH_STATUS[om.overallHealth];
            return (
              <Card
                key={om.id}
                className={`p-4 border cursor-pointer hover:shadow-lg transition-shadow ${healthConfig.borderColor}`}
                onClick={() => onOMClick(om.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${healthConfig.dotColor}`} />
                      <h3 className="font-semibold text-slate-900">{om.name}</h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{om.location}</p>
                  </div>
                  {om.alerts > 0 && (
                    <Badge variant="destructive" className="h-6">
                      {om.alerts}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Revenue */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Revenue</span>
                    <span className={`font-semibold ${HEALTH_STATUS[om.kpis.revenue.status].textColor}`}>
                      {om.kpis.revenue.percentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Units */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Units Today</span>
                    <span className={`font-semibold ${HEALTH_STATUS[om.kpis.units.status].textColor}`}>
                      {om.kpis.units.percentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Conversion */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Conversion</span>
                    <span className={`font-semibold ${HEALTH_STATUS[om.kpis.conversion.status].textColor}`}>
                      {om.kpis.conversion.rate.toFixed(1)}%
                    </span>
                  </div>

                  {/* Retention */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Retention</span>
                    <span className={`font-semibold ${HEALTH_STATUS[om.kpis.retention.status].textColor}`}>
                      {om.kpis.retention.rate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {om.teamsSummary.activeWashers}/{om.teamsSummary.washers}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor((Date.now() - om.lastActivity.getTime()) / 60000)}m ago
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
