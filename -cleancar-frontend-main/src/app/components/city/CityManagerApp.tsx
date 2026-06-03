/**
 * CITY MANAGER APP - P&L CONTROL SYSTEM
 * Strategic Decision Layer - NOT Operations Interface
 * 
 * Philosophy:
 * - City Manager = CEO of City Business
 * - Works ONLY through Cluster Managers
 * - Revenue + EBITDA + Retention + Expansion ownership
 * 
 * Screens:
 * 1. City Command Dashboard (Primary)
 * 2. Cluster Performance View
 * 3. Cluster Intervention & Governance
 * 4. Revenue & EBITDA Dashboard
 * 5. Retention & Customer Health
 * 6. Expansion & Territory Planning
 * 7. Alerts & Strategic Escalations
 * 8. Reports & Analytics
 * 9. Incentive Tracker
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  MapPin,
  FileText,
  Award,
  ArrowLeft,
  BarChart3,
  Activity,
  AlertCircle,
} from "lucide-react";
import { cityManagerService } from "../../services/cityManagerService";
import { CURRENT_CITY_MANAGER } from "../../constants/cityManager.constants";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { organizationHierarchyService } from "../../services/organizationHierarchyService";
import { CityManagerPincodeManagement } from "./CityManagerPincodeManagement";

type Screen =
  | "COMMAND_DASHBOARD"
  | "CLUSTER_PERFORMANCE"
  | "INTERVENTIONS"
  | "REVENUE_EBITDA"
  | "RETENTION"
  | "EXPANSION"
  | "PINCODE_MANAGEMENT"
  | "ALERTS"
  | "REPORTS"
  | "INCENTIVE";

export function CityManagerApp() {
  const { currentUser, currentRole } = useRole();
  const { city } = useCity();
  const [activeScreen, setActiveScreen] = useState<Screen>("COMMAND_DASHBOARD");
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  // ✅ Get city for current user
  const userCity = currentUser.cityId
    ? organizationHierarchyService.getCityById(currentUser.cityId)
    : null;

  // Load data filtered by selected city
  const cityKPIs = cityManagerService.getCityKPIs(city);
  const clusters = cityManagerService.getClusterCards(city);
  const alerts = cityManagerService.getCityAlerts(city);
  const interventions = cityManagerService.getClusterInterventions(city);

  const criticalAlerts = alerts.filter((a) => a.priority === "CRITICAL").length;
  const activeInterventions = interventions.filter(
    (i) => i.status === "OPEN" || i.status === "IN_PROGRESS"
  ).length;

  // Screen Navigation
  const renderScreen = () => {
    switch (activeScreen) {
      case "COMMAND_DASHBOARD":
        return <CommandDashboard />;
      case "CLUSTER_PERFORMANCE":
        return <ClusterPerformance clusterId={selectedClusterId} onBack={() => setActiveScreen("COMMAND_DASHBOARD")} />;
      case "INTERVENTIONS":
        return <InterventionGovernance />;
      case "REVENUE_EBITDA":
        return <RevenueEBITDADashboard />;
      case "RETENTION":
        return <RetentionHealth />;
      case "EXPANSION":
        return <ExpansionPlanning />;
      case "PINCODE_MANAGEMENT":
        return <CityManagerPincodeManagement />;
      case "ALERTS":
        return <AlertsEscalations />;
      case "REPORTS":
        return <ReportsAnalytics />;
      case "INCENTIVE":
        return <IncentiveTracker />;
      default:
        return <CommandDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">City Command Center</h1>
            <p className="text-sm text-gray-500">
              {currentUser.name} • {userCity?.name || "Surat"} • {clusters.length} Cluster{clusters.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Revenue MTD</p>
              <p className="text-lg font-bold text-gray-900">
                ₹{(cityKPIs.revenue.mtd / 100000).toFixed(1)}L
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">EBITDA</p>
              <p className="text-lg font-bold text-green-600">
                {cityKPIs.ebitda.percentage.toFixed(1)}%
              </p>
            </div>
            {criticalAlerts > 0 && (
              <Badge variant="destructive" className="h-8">
                {criticalAlerts} Critical
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6 overflow-x-auto">
          {[
            { id: "COMMAND_DASHBOARD", label: "Command Dashboard", icon: BarChart3 },
            { id: "INTERVENTIONS", label: "Governance", icon: AlertCircle, badge: activeInterventions },
            { id: "REVENUE_EBITDA", label: "P&L", icon: DollarSign },
            { id: "RETENTION", label: "Retention", icon: Users },
            { id: "EXPANSION", label: "Expansion", icon: MapPin },
            { id: "PINCODE_MANAGEMENT", label: "Pincodes", icon: Target },
            { id: "ALERTS", label: "Alerts", icon: AlertTriangle, badge: criticalAlerts },
            { id: "REPORTS", label: "Reports", icon: FileText },
            { id: "INCENTIVE", label: "Incentive", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeScreen === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveScreen(tab.id as Screen)}
                className={`relative flex items-center gap-2 py-4 px-3 border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen Content */}
      <div className="p-6">{renderScreen()}</div>
    </div>
  );
}

// ============================================
// 1️⃣ COMMAND DASHBOARD (PRIMARY SCREEN)
// ============================================

function CommandDashboard() {
  const cityKPIs = cityManagerService.getCityKPIs();
  const clusters = cityManagerService.getClusterCards();
  const alerts = cityManagerService.getCityAlerts();

  const criticalClusters = clusters.filter((c) => c.status === "RED").length;
  const amberClusters = clusters.filter((c) => c.status === "AMBER").length;

  return (
    <div className="space-y-6">
      {/* City KPI Strip */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Revenue vs Target</p>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {cityKPIs.revenue.percentage.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ₹{(cityKPIs.revenue.mtd / 100000).toFixed(1)}L / ₹{(cityKPIs.revenue.target / 100000).toFixed(1)}L
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            {cityKPIs.revenue.growth.toFixed(1)}% growth
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">EBITDA %</p>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {cityKPIs.ebitda.percentage.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ₹{(cityKPIs.ebitda.amount / 100000).toFixed(1)}L
          </p>
          <div className="mt-2">
            <Badge variant={cityKPIs.ebitda.percentage >= 25 ? "default" : "destructive"}>
              {cityKPIs.ebitda.percentage >= 25 ? "Above Threshold" : "Below Threshold"}
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Retention Rate</p>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {cityKPIs.retention.percentage.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Churn: {cityKPIs.retention.churnRate.toFixed(1)}%
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            Trending up
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Units Today</p>
            <Target className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {cityKPIs.units.today}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Target: {cityKPIs.units.todayTarget} • MTD: {cityKPIs.units.mtd}
          </p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${(cityKPIs.units.today / cityKPIs.units.todayTarget) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Customers</p>
            <Users className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {cityKPIs.activeCustomers.total.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            High Value: {cityKPIs.activeCustomers.highValue}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            {cityKPIs.activeCustomers.growth.toFixed(1)}% MoM
          </div>
        </Card>
      </div>

      {/* Attendance Dashboard */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Team Attendance - Today</h3>
            <p className="text-sm text-slate-600">Real-time attendance across the city hierarchy</p>
          </div>
          <Badge variant="outline" className="bg-white">
            <Users className="w-3 h-3 mr-1" />
            City-wide View
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Cluster Managers */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Cluster Managers</p>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                Strategic
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900">{cityKPIs.attendance.clusterManagers.present}</span>
              <span className="text-lg text-slate-500">/ {cityKPIs.attendance.clusterManagers.expected}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    cityKPIs.attendance.clusterManagers.percentage >= 95
                      ? "bg-green-500"
                      : cityKPIs.attendance.clusterManagers.percentage >= 85
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${cityKPIs.attendance.clusterManagers.percentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700 min-w-[45px]">
                {cityKPIs.attendance.clusterManagers.percentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Operations Managers */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Operations Managers</p>
              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                Tactical
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900">{cityKPIs.attendance.operationsManagers.present}</span>
              <span className="text-lg text-slate-500">/ {cityKPIs.attendance.operationsManagers.expected}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    cityKPIs.attendance.operationsManagers.percentage >= 95
                      ? "bg-green-500"
                      : cityKPIs.attendance.operationsManagers.percentage >= 85
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${cityKPIs.attendance.operationsManagers.percentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700 min-w-[45px]">
                {cityKPIs.attendance.operationsManagers.percentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Supervisors */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Supervisors</p>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Team Leads
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900">{cityKPIs.attendance.supervisors.present}</span>
              <span className="text-lg text-slate-500">/ {cityKPIs.attendance.supervisors.expected}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    cityKPIs.attendance.supervisors.percentage >= 90
                      ? "bg-green-500"
                      : cityKPIs.attendance.supervisors.percentage >= 80
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${cityKPIs.attendance.supervisors.percentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700 min-w-[45px]">
                {cityKPIs.attendance.supervisors.percentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Washers */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Washers</p>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Field Team
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900">{cityKPIs.attendance.washers.present}</span>
              <span className="text-lg text-slate-500">/ {cityKPIs.attendance.washers.expected}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    cityKPIs.attendance.washers.percentage >= 90
                      ? "bg-green-500"
                      : cityKPIs.attendance.washers.percentage >= 80
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${cityKPIs.attendance.washers.percentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700 min-w-[45px]">
                {cityKPIs.attendance.washers.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-600 mb-1">Total Present</p>
              <p className="text-lg font-bold text-slate-900">
                {cityKPIs.attendance.clusterManagers.present +
                 cityKPIs.attendance.operationsManagers.present +
                 cityKPIs.attendance.supervisors.present +
                 cityKPIs.attendance.washers.present}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Total Expected</p>
              <p className="text-lg font-bold text-slate-900">
                {cityKPIs.attendance.clusterManagers.expected +
                 cityKPIs.attendance.operationsManagers.expected +
                 cityKPIs.attendance.supervisors.expected +
                 cityKPIs.attendance.washers.expected}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Overall Attendance</p>
              <p className="text-lg font-bold text-green-600">
                {(((cityKPIs.attendance.clusterManagers.present + cityKPIs.attendance.operationsManagers.present + cityKPIs.attendance.supervisors.present + cityKPIs.attendance.washers.present) /
                   (cityKPIs.attendance.clusterManagers.expected + cityKPIs.attendance.operationsManagers.expected + cityKPIs.attendance.supervisors.expected + cityKPIs.attendance.washers.expected)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Summary */}
      {alerts.length > 0 && (
        <Card className="p-4 border-l-4 border-red-500">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Strategic Alerts ({alerts.length})</h3>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{alert.title}</span>
                      <span className="text-gray-600 ml-2">{alert.impact}</span>
                    </div>
                    <Badge variant={alert.priority === "CRITICAL" ? "destructive" : "secondary"}>
                      {alert.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Cluster Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cluster Performance</h2>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="default" className="bg-green-100 text-green-800">
              {clusters.filter((c) => c.status === "GREEN").length} Green
            </Badge>
            <Badge variant="default" className="bg-amber-100 text-amber-800">
              {amberClusters} Amber
            </Badge>
            <Badge variant="destructive">
              {criticalClusters} Red
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {clusters.map((cluster) => (
            <Card
              key={cluster.id}
              className={`p-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${
                cluster.status === "GREEN"
                  ? "border-green-500"
                  : cluster.status === "AMBER"
                  ? "border-amber-500"
                  : "border-red-500"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{cluster.clusterName}</h3>
                  <p className="text-sm text-gray-600">CM: {cluster.cmName}</p>
                  {cluster.pincodeDetails && cluster.pincodeDetails.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {cluster.pincodeDetails.map((pc) => (
                        <Badge key={pc.pincodeId} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {pc.pincode} - {pc.areaName}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Badge
                  variant={cluster.status === "GREEN" ? "default" : cluster.status === "AMBER" ? "secondary" : "destructive"}
                  className="ml-2 flex-shrink-0"
                >
                  {cluster.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Revenue</p>
                  <p className="text-lg font-bold text-gray-900">
                    {cluster.revenue.percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    ₹{(cluster.revenue.mtd / 100000).toFixed(1)}L
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">EBITDA</p>
                  <p className="text-lg font-bold text-gray-900">
                    {cluster.ebitda.percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    ₹{(cluster.ebitda.contribution / 100000).toFixed(1)}L
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Retention</p>
                  <p className="text-lg font-bold text-gray-900">
                    {cluster.retention.percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    {cluster.retention.customersAtRisk} at risk
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>{cluster.omCount} OMs</span>
                  <span>{cluster.teamCount} Teams</span>
                  <span>{cluster.washerCount} Washers</span>
                </div>
                {cluster.activeAlerts > 0 && (
                  <Badge variant="destructive" className="h-5">
                    {cluster.activeAlerts} Alerts
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Strategic Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Expansion Pipeline</h3>
          <p className="text-3xl font-bold text-gray-900">1</p>
          <p className="text-xs text-gray-500 mt-1">Proposed clusters</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Territory Coverage</h3>
          <p className="text-3xl font-bold text-gray-900">80%</p>
          <p className="text-xs text-gray-500 mt-1">16/20 territories active</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Cluster Ranking</h3>
          <p className="text-sm text-gray-900">
            {clusters.length >= 3 ? (
              <>🥇 {clusters[0]?.clusterName} • 🥈 {clusters[1]?.clusterName} • 🥉 {clusters[2]?.clusterName}</>
            ) : (
              clusters.map((c, i) => `${['🥇', '🥈', '🥉'][i] || '•'} ${c.clusterName}`).join(' • ')
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}

// Placeholder components for other screens (will be implemented similarly)
function ClusterPerformance({ clusterId, onBack }: { clusterId: string | null; onBack: () => void }) {
  return (
    <div>
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Cluster Performance Detail</h2>
        <p className="text-gray-600">Detailed cluster analysis will be displayed here</p>
      </Card>
    </div>
  );
}

function InterventionGovernance() {
  const interventions = cityManagerService.getClusterInterventions();
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Cluster Intervention & Governance</h2>
      <p className="text-sm text-gray-600">Manage Cluster Manager performance through strategic interventions</p>
      
      <div className="grid gap-4">
        {interventions.map((intervention) => (
          <Card key={intervention.id} className="p-4 border-l-4 border-red-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{intervention.clusterName}</h3>
                <p className="text-sm text-gray-600">CM: {intervention.cmName}</p>
              </div>
              <Badge variant="destructive">{intervention.severity}</Badge>
            </div>
            
            <p className="text-sm text-gray-700 mb-3">{intervention.problemSummary}</p>
            
            <div className="bg-gray-50 p-3 rounded-lg mb-3">
              <p className="text-xs font-medium text-gray-600 mb-1">Auto-Generated Analysis</p>
              <p className="text-sm text-gray-800">{intervention.autoGeneratedAnalysis.rootCause}</p>
            </div>
            
            {intervention.cityManagerActions.strategicPlan && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-blue-600 mb-1">Strategic Plan</p>
                <p className="text-sm text-gray-800">{intervention.cityManagerActions.strategicPlan}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary">{intervention.status.replace(/_/g, " ")}</Badge>
              <span className="text-xs text-gray-500">
                {intervention.daysSinceTrigger} days since trigger
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RevenueEBITDADashboard() {
  const { city } = useCity();
  const data = cityManagerService.getRevenueEBITDADashboard(city);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Revenue & EBITDA Dashboard</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="font-bold">₹{(data.revenue.total / 100000).toFixed(1)}L</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${data.revenue.percentage}%` }}
                />
              </div>
            </div>
            
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-gray-600 mb-2">Cluster Contributions</p>
              {data.revenue.clusterContributions.map((cluster) => (
                <div key={cluster.clusterName} className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{cluster.clusterName}</span>
                  <span className="font-medium">₹{(cluster.amount / 100000).toFixed(1)}L ({cluster.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">EBITDA & Cost Structure</h3>
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">EBITDA</p>
              <p className="text-3xl font-bold text-green-600">{data.ebitda.percentage.toFixed(1)}%</p>
              <p className="text-xs text-gray-600">₹{(data.ebitda.amount / 100000).toFixed(1)}L</p>
            </div>
            
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-gray-600 mb-2">Cost Breakdown</p>
              {Object.entries(data.ebitda.costBreakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="font-medium">₹{(value / 100000).toFixed(1)}L</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      
      {data.insights.costSpikeAlerts.length > 0 && (
        <Card className="p-4 border-l-4 border-amber-500">
          <h3 className="font-semibold text-gray-900 mb-2">Cost Alerts</h3>
          {data.insights.costSpikeAlerts.map((alert, idx) => (
            <p key={idx} className="text-sm text-gray-700">
              {alert.category}: {alert.increase}% increase (threshold: {alert.threshold}%)
            </p>
          ))}
        </Card>
      )}
    </div>
  );
}

function RetentionHealth() {
  const { city } = useCity();
  const data = cityManagerService.getRetentionCustomerHealth(city);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Retention & Customer Health</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-2">90-Day Retention</p>
          <p className="text-3xl font-bold text-gray-900">{data.retention90Day.percentage.toFixed(1)}%</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            {data.retention90Day.trend}
          </div>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-2">Churn Rate</p>
          <p className="text-3xl font-bold text-gray-900">
            {data.churnTrend[data.churnTrend.length - 1].churnRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {data.churnTrend[data.churnTrend.length - 1].customersLost} customers lost this month
          </p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-2">High Risk Customers</p>
          <p className="text-3xl font-bold text-red-600">
            {data.highRiskSegments.reduce((sum, seg) => sum + seg.customersCount, 0)}
          </p>
          <Badge variant="destructive" className="mt-2">Requires Action</Badge>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Cluster Retention Comparison</h3>
        <div className="space-y-3">
          {data.clusterRetentionComparison.map((cluster) => (
            <div key={cluster.clusterName}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">{cluster.clusterName}</span>
                <span className="font-medium">{cluster.retentionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    cluster.retentionRate >= 80 ? "bg-green-500" : cluster.retentionRate >= 70 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${cluster.retentionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ExpansionPlanning() {
  const { city } = useCity();
  const data = cityManagerService.getExpansionPlanning(city);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Expansion & Territory Planning</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-2">Territory Coverage</p>
          <p className="text-3xl font-bold text-gray-900">{data.cityOverview.coveragePercentage}%</p>
          <p className="text-xs text-gray-600 mt-2">
            {data.cityOverview.activeTerritories}/{data.cityOverview.totalTerritories} territories
          </p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-2">Proposed Expansions</p>
          <p className="text-3xl font-bold text-gray-900">{data.proposedExpansionZones.length}</p>
          <p className="text-xs text-gray-600 mt-2">Ready for approval</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-2">Cluster Pipeline</p>
          <p className="text-3xl font-bold text-gray-900">{data.clusterPipeline.proposedClusters}</p>
          <p className="text-xs text-gray-600 mt-2">New clusters proposed</p>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Proposed Expansion Zones</h3>
        <div className="space-y-3">
          {data.proposedExpansionZones.map((zone) => (
            <div key={zone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{zone.name}</p>
                <p className="text-sm text-gray-600">
                  Potential: ₹{(zone.potentialRevenue / 100000).toFixed(1)}L • Investment: ₹{(zone.investmentRequired / 100000).toFixed(1)}L
                </p>
              </div>
              <div className="text-right">
                <Badge variant={zone.priority === "HIGH" ? "destructive" : "secondary"}>
                  {zone.priority}
                </Badge>
                <p className="text-xs text-gray-600 mt-1">{zone.timelineMonths} months</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AlertsEscalations() {
  const alerts = cityManagerService.getCityAlerts();
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Alerts & Strategic Escalations</h2>
      <p className="text-sm text-gray-600">High-level issues requiring City Manager attention</p>
      
      {alerts.map((alert) => (
        <Card key={alert.id} className={`p-4 border-l-4 ${alert.priority === "CRITICAL" ? "border-red-500" : "border-amber-500"}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                <Badge variant={alert.priority === "CRITICAL" ? "destructive" : "secondary"}>
                  {alert.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
              <p className="text-sm font-medium text-gray-900">Impact: {alert.impact}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
            <span>Affected: {(alert.affectedClusters ?? []).join(", ")}</span>
            <span>Time elapsed: {Math.floor(alert.timeElapsed / 60)} hours</span>
            {alert.autoEscalateIn && (
              <span className="text-red-600">Auto-escalates in: {Math.floor(alert.autoEscalateIn / 60)} hours</span>
            )}
          </div>
          
          <div className="flex gap-2">
            {alert.actions.escalateToMD && (
              <Button size="sm" variant="destructive">Escalate to MD</Button>
            )}
            {alert.actions.initiateIntervention && (
              <Button size="sm" variant="outline">Initiate Intervention</Button>
            )}
            {alert.actions.requiresDecision && (
              <Button size="sm">Log Decision</Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ReportsAnalytics() {
  const reports = cityManagerService.getCityReports();
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Reports & Analytics</h2>
      
      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">{report.reportType.replace(/_/g, " ")}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{report.month}</p>
                <p className="text-sm text-gray-700">{report.summary}</p>
              </div>
              <Button size="sm" variant="outline">Download</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function IncentiveTracker() {
  const data = cityManagerService.getCityManagerIncentive();
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Incentive Tracker - {data.month}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">KPI Scoring</h3>
          <div className="space-y-4">
            {Object.entries(data.kpiScoring).map(([key, kpi]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 capitalize">{key}</span>
                  <span className="font-bold">{kpi.achievement.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${kpi.achievement}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Weightage: {kpi.weightage}% • Score: {kpi.score.toFixed(1)}
                </p>
              </div>
            ))}
          </div>
          
          {!data.kpiScoring.ebitda.thresholdMet && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ EBITDA below mandatory threshold - Zero payout
              </p>
            </div>
          )}
        </Card>
        
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Incentive Forecast</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base Incentive</span>
              <span className="font-medium">₹{(data.incentiveForecast.baseIncentive / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">KPI Bonus</span>
              <span className="font-medium text-green-600">+₹{(data.incentiveForecast.kpiBonus / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Growth Bonus</span>
              <span className="font-medium text-green-600">+₹{(data.incentiveForecast.growthBonus / 1000).toFixed(0)}K</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total Projected</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₹{(data.incentiveForecast.totalProjected / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Month Payout</span>
                <span className="font-medium">₹{(data.lastMonthPayout / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3" />
                Trend: {data.trend}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              ✓ System-calculated • Last updated: {data.auditLog.lastRecalculated.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
