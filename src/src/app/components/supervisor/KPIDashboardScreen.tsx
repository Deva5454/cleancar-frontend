/**
 * MODULE 11: KPI Dashboard Screen
 * 4-component KPI structure with performance tracking
 */

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPIDashboard, KPIComponent } from "../../services/kpiDashboardService";

export interface KPIDashboardScreenProps {
  dashboard: KPIDashboard;
}

export function KPIDashboardScreen({ dashboard }: KPIDashboardScreenProps) {
  const { overallScore, overallStatus, threshold, components, monthlySnapshot, alerts } =
    dashboard;

  const overallStatusConfig = {
    EXCELLENT: { color: "bg-green-100 text-green-700 border-green-300", label: "Excellent" },
    GOOD: { color: "bg-blue-100 text-blue-700 border-blue-300", label: "Good" },
    WARNING: { color: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "Warning" },
    CRITICAL: { color: "bg-red-100 text-red-700 border-red-300", label: "Critical" },
  }[overallStatus];

  const getComponentColorClasses = (color: string) => {
    const colorMap: Record<
      string,
      { bg: string; border: string; text: string; progressBg: string }
    > = {
      green: {
        bg: "bg-green-50",
        border: "border-green-300",
        text: "text-green-700",
        progressBg: "bg-green-500",
      },
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-300",
        text: "text-blue-700",
        progressBg: "bg-blue-500",
      },
      yellow: {
        bg: "bg-yellow-50",
        border: "border-yellow-300",
        text: "text-yellow-700",
        progressBg: "bg-yellow-500",
      },
      red: {
        bg: "bg-red-50",
        border: "border-red-300",
        text: "text-red-700",
        progressBg: "bg-red-500",
      },
    };

    return colorMap[color] || colorMap.blue;
  };

  const renderKPIComponent = (component: KPIComponent) => {
    const colors = getComponentColorClasses(component.statusColor);

    return (
      <Card key={component.name} className={`border-2 ${colors.border} ${colors.bg}`}>
        <CardContent className="p-4">
          {/* Row 1: Name + Weight */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-gray-900">{component.name}</h3>
            <Badge variant="outline" className={`${colors.text} border-current`}>
              {component.weight}%
            </Badge>
          </div>

          {/* Row 2: Score */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Score</span>
              <span className={`text-2xl font-bold ${colors.text}`}>
                {component.score.toFixed(1)}/{component.weight}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.progressBg}`}
                style={{ width: `${(component.score / component.weight) * 100}%` }}
              />
            </div>
          </div>

          {/* Row 3: Current vs Target */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/50 rounded p-2 border border-gray-200">
              <p className="text-xs text-gray-600">Current</p>
              <p className="text-sm font-bold text-gray-900">
                {component.currentValue.toFixed(1)}
                {component.name.includes("Conversion") || component.name.includes("Retention")
                  ? "%"
                  : ""}
              </p>
            </div>
            <div className="bg-white/50 rounded p-2 border border-gray-200">
              <p className="text-xs text-gray-600">Target</p>
              <p className="text-sm font-bold text-gray-900">
                {component.name.includes("Complaints") ? "0" : `≥${component.target.toFixed(0)}`}
                {component.name.includes("Conversion") || component.name.includes("Retention")
                  ? "%"
                  : ""}
              </p>
            </div>
          </div>

          {/* Row 4: Details */}
          <div className="space-y-1">
            {component.details.map((detail, idx) => (
              <p key={idx} className="text-xs text-gray-700">
                • {detail}
              </p>
            ))}
          </div>

          {/* Row 5: Action Required */}
          {component.actionRequired && (
            <div className="mt-3 bg-red-100 border border-red-300 rounded p-2">
              <p className="text-xs font-semibold text-red-700">⚠️ {component.actionRequired}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "UP":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "DOWN":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-purple-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">KPI Dashboard</h1>
          <p className="text-sm text-purple-100">Performance Breakdown</p>
        </div>

        {/* Overall Score */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-purple-100">Overall KPI Score</p>
              <p className="text-4xl font-bold">{overallScore.toFixed(0)}/100</p>
              <p className="text-xs text-purple-100">Threshold: {threshold}</p>
            </div>
            <Badge variant="outline" className={`${overallStatusConfig.color} text-lg px-4 py-2`}>
              {overallStatusConfig.label}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                overallScore >= threshold ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>

        {/* Monthly Snapshot */}
        <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-100">Monthly Average</p>
              <p className="text-lg font-bold">{monthlySnapshot.averageScore}/100</p>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(monthlySnapshot.trend)}
              <span className="text-sm">{monthlySnapshot.trend}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Action Required ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((alert, idx) => (
                <div key={idx} className="bg-white rounded p-2 border border-red-200">
                  <p className="text-xs font-semibold text-red-700">• {alert}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* KPI Component 1: Lead Conversion (40%) */}
        {renderKPIComponent(components.leadConversion)}

        {/* KPI Component 2: Retention (30%) */}
        {renderKPIComponent(components.retention)}

        {/* KPI Component 3: Audit Compliance (20%) */}
        {renderKPIComponent(components.auditCompliance)}

        {/* KPI Component 4: Customer Complaints (10%) */}
        {renderKPIComponent(components.customerComplaints)}

        {/* Summary Notice */}
        <Card className="border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              📊 KPI Calculation
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• Lead Conversion (40%): ≥30% = Full points</p>
              <p>• Retention (30%): ≥80% = Full points, &lt;60% = Ops flag</p>
              <p>• Audit Compliance (20%): ≥4/day + Every washer ≤4 days</p>
              <p>• Customer Complaints (10%): Zero unresolved &gt;24h</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
