/**
 * TSM TEAM PERFORMANCE - Individual TSE Monitoring
 * Track each sales executive's KPIs, bundle mix, and compliance
 *
 * Philosophy: Performance visibility without micromanagement
 * Shows: Outcomes (conversions, revenue) NOT activity logs
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  User,
  Phone,
  TrendingUp,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle2,
  Circle,
  Award,
  BarChart3,
} from "lucide-react";
import { teleSalesManagerService } from "../../services/teleSalesManagerService";
import { planSyncService } from "../../services/planSyncService";

// ─── Plan revenue helpers ─────────────────────────────────────────────────────
const PLAN_NAMES: Record<string, string> = {
  SHINE: "Express Wash", PROTECT: "Smart Wash", ELITE: "Elite Wash",
  EXPRESS_WASH: "Express Wash", SMART_WASH: "Smart Wash", ELITE_WASH: "Elite Wash",
};
const PLAN_COLORS_BAR: Record<string, string> = {
  SHINE: "bg-blue-500", PROTECT: "bg-purple-500", ELITE: "bg-yellow-500",
  EXPRESS_WASH: "bg-blue-500", SMART_WASH: "bg-purple-500", ELITE_WASH: "bg-yellow-500",
};

/** Average plan price across vehicle types for revenue quality indicator */
function getAvgPlanPrice(planId: string): number {
  try {
    const plans = planSyncService.getAllPlanPrices();
    const plan = plans.find(p => p.tierId === planId || p.id === planId);
    if (!plan) return 0;
    return Math.round((plan.hatchback + plan.suv + plan.luxury) / 3);
  } catch { return 0; }
}

/** Revenue quality: avg deal value per conversion */
function getRevenueQuality(planMix: Record<string, number>, totalConversions: number): {
  avgDealValue: number; quality: "HIGH" | "MED" | "LOW"
} {
  if (!planMix || totalConversions === 0) return { avgDealValue: 0, quality: "LOW" };
  const weighted = Object.entries(planMix).reduce((sum, [plan, pct]) => {
    const price = getAvgPlanPrice(plan);
    return sum + (price * pct / 100);
  }, 0);
  const avgDeal = Math.round(weighted * 3 * 1.18); // 3mo default × GST
  return {
    avgDealValue: avgDeal,
    quality: avgDeal > 6000 ? "HIGH" : avgDeal > 4000 ? "MED" : "LOW",
  };
}
import type { TSEPerformanceCard } from "../../types/teleSalesManager.types";

interface TSMTeamPerformanceProps {
  onSelectTSE?: (tseId: string) => void;
}

export function TSMTeamPerformance({ onSelectTSE }: TSMTeamPerformanceProps) {
  const tseCards = teleSalesManagerService.getTSEPerformanceCards();
  const [selectedTSE, setSelectedTSE] = useState<string | null>(null);

  const handleSelectTSE = (tseId: string) => {
    setSelectedTSE(tseId);
    // C4 FIX: parent needs to implement drill-down (currently empty handler)
    // Calling onSelectTSE passes tseId up to TeleSalesManagerApp for future navigation
    onSelectTSE?.(tseId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ON_CALL":
        return <Phone className="w-4 h-4 text-green-600 animate-pulse" />;
      case "ACTIVE":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "OFFLINE":
        return <Circle className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ON_CALL":
        return "bg-green-600";
      case "ACTIVE":
        return "bg-blue-600";
      case "OFFLINE":
        return "bg-gray-400";
      default:
        return "bg-gray-600";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "GREEN":
        return "border-green-300 bg-green-50";
      case "AMBER":
        return "border-amber-300 bg-amber-50";
      case "RED":
        return "border-red-300 bg-red-50";
      default:
        return "border-gray-300";
    }
  };

  const getKPIStatus = (status: string) => {
    switch (status) {
      case "GREEN":
        return "text-green-600";
      case "AMBER":
        return "text-amber-600";
      case "RED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Team summary stats
  const teamStats = {
    totalActive: tseCards.filter((t) => t.status !== "OFFLINE").length,
    totalOnCall: tseCards.filter((t) => t.status === "ON_CALL").length,
    greenHealth: tseCards.filter((t) => t.overallHealth === "GREEN").length,
    redHealth: tseCards.filter((t) => t.overallHealth === "RED").length,
    totalAlerts: tseCards.reduce((sum, t) => sum + t.alerts, 0),
// C5 FIX: exclude OFFLINE TSEs from team avg conversion
    avgConversion: (() => {
      const activeTSEs = tseCards.filter(t => t.status !== "OFFLINE");
      return activeTSEs.length > 0
        ? activeTSEs.reduce((sum, t) => sum + t.kpis.conversionRate.rate, 0) / activeTSEs.length
        : 0;
    })(),
  };

  return (
    <div className="space-y-6">
      {/* Team Summary Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Team Performance Overview
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge className="bg-green-600">
              {teamStats.totalActive}/{tseCards.length} Active
            </Badge>
            <Badge className="bg-blue-600">
              {teamStats.totalOnCall} On Call
            </Badge>
            {teamStats.totalAlerts > 0 && (
              <Badge className="bg-red-600">
                {teamStats.totalAlerts} Alerts
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Team Avg Conversion</div>
            <div className="text-2xl font-bold text-indigo-600">
              {teamStats.avgConversion.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Green Health</div>
            <div className="text-2xl font-bold text-green-600">
              {teamStats.greenHealth}
            </div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Amber Health</div>
            <div className="text-2xl font-bold text-amber-600">
              {tseCards.filter((t) => t.overallHealth === "AMBER").length}
            </div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Red Health</div>
            <div className="text-2xl font-bold text-red-600">
              {teamStats.redHealth}
            </div>
          </div>
        </div>
      </Card>

      {/* TSE Performance Cards */}
      <div className="grid grid-cols-1 gap-4">
        {tseCards.map((tse) => (
          <Card
            key={tse.id}
            className={`p-3 sm:p-4 lg:p-6 cursor-pointer transition-all hover:shadow-lg ${getHealthColor(
              tse.overallHealth
            )} ${selectedTSE === tse.id ? "border-2 border-indigo-500" : "border-2"}`}
            onClick={() => handleSelectTSE(tse.id)}
          >
            <div className="space-y-4">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{tse.name}</div>
                    <div className="text-xs text-gray-500">{tse.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(tse.status)}>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(tse.status)}
                      {tse.status.replace("_", " ")}
                    </div>
                  </Badge>
                  <Badge
                    className={
                      tse.overallHealth === "GREEN"
                        ? "bg-green-600"
                        : tse.overallHealth === "AMBER"
                        ? "bg-amber-600"
                        : "bg-red-600"
                    }
                  >
                    {tse.overallHealth}
                  </Badge>
                  {tse.alerts > 0 && (
                    <Badge className="bg-red-600 animate-pulse">
                      {tse.alerts} Alert{tse.alerts > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>

              {/* KPIs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Calls Made */}
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600">Calls Today</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {tse.kpis.callsMade.today}
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: {tse.kpis.callsMade.target}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${
                        tse.kpis.callsMade.percentage >= 90
                          ? "bg-green-600"
                          : tse.kpis.callsMade.percentage >= 70
                          ? "bg-amber-600"
                          : "bg-red-600"
                      }`}
                      style={{
                        width: `${Math.min(tse.kpis.callsMade.percentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-gray-600">Conversion Rate</span>
                  </div>
                  <div
                    className={`text-lg font-bold ${getKPIStatus(
                      tse.kpis.conversionRate.status
                    )}`}
                  >
                    {tse.kpis.conversionRate.rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: {tse.kpis.conversionRate.target}%
                  </div>
                </div>

                {/* CRM Compliance */}
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs text-gray-600">CRM Compliance</span>
                  </div>
                  <div
                    className={`text-lg font-bold ${getKPIStatus(
                      tse.kpis.crmCompliance.status
                    )}`}
                  >
                    {tse.kpis.crmCompliance.score}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: {tse.kpis.crmCompliance.target}%
                  </div>
                </div>

                {/* Revenue Generated — with GST note */}
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600">Revenue MTD</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    ₹{(tse.kpis.revenueGenerated.mtd / 100000).toFixed(1)}L
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: ₹{(tse.kpis.revenueGenerated.target / 100000).toFixed(1)}L
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">excl. GST</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${
                        tse.kpis.revenueGenerated.percentage >= 100
                          ? "bg-green-600"
                          : tse.kpis.revenueGenerated.percentage >= 85
                          ? "bg-amber-600"
                          : "bg-red-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          tse.kpis.revenueGenerated.percentage,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bundle Mix & Incentives Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Plan Mix — replaces old Base/AddOn/BundleMID/BundleLOW */}
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-gray-700">Plan Mix</span>
                    </div>
                    {(() => {
                      const rq = getRevenueQuality(tse.planMix || {}, tse.kpis.conversionRate.rate);
                      return (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          rq.quality === "HIGH" ? "bg-green-100 text-green-700"
                          : rq.quality === "MED" ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                          {rq.quality} quality · ₹{(rq.avgDealValue/1000).toFixed(1)}K avg
                        </span>
                      );
                    })()}
                  </div>
                  <div className="space-y-2">
                    {/* Plan mix bars from tse.planMix or fallback from bundleMix */}
                    {[
                      { id: "ELITE",   label: "Elite Wash",   pct: tse.planMix?.ELITE   ?? tse.bundleMix?.bundleMID ?? 0 },
                      { id: "PROTECT", label: "Smart Wash",   pct: tse.planMix?.PROTECT ?? tse.bundleMix?.base      ?? 0 },
                      { id: "SHINE",   label: "Express Wash", pct: tse.planMix?.SHINE   ?? tse.bundleMix?.bundleLOW ?? 0 },
                    ].map(plan => (
                      <div key={plan.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">{plan.label}</span>
                          <span className={`text-xs font-semibold ${
                            plan.id === "ELITE" && plan.pct > 30 ? "text-green-600"
                            : plan.id === "SHINE" && plan.pct > 60 ? "text-red-600"
                            : "text-gray-900"
                          }`}>{plan.pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${PLAN_COLORS_BAR[plan.id]}`}
                            style={{ width: `${Math.min(plan.pct, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                    {/* Add-on attach rate */}
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-xs text-gray-500">Add-on attach rate</span>
                      <span className={`text-xs font-semibold ${
                        (tse.bundleMix?.addOn ?? 0) >= 40 ? "text-green-600" : "text-amber-600"
                      }`}>{tse.bundleMix?.addOn ?? 0}%</span>
                    </div>
                    {(tse.planMix?.SHINE ?? tse.bundleMix?.bundleLOW ?? 0) > 60 && (
                      <div className="mt-1">
                        <div className="text-xs text-red-600 font-medium">⚠ Mostly selling Express Wash — coach to upsell</div>
                        <button className="text-xs text-blue-600 underline mt-1"
                          onClick={(e) => { e.stopPropagation();
                            alert(`Coach ${tse.name}:\nFocus: Upsell Express → Smart/Elite Wash.\nRevenue impact: +₹${getAvgPlanPrice("PROTECT") - getAvgPlanPrice("SHINE")}/mo per upgrade.`);
                          }}>
                          Schedule coaching →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Incentive Forecast */}
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-gray-700">
                      Incentive Forecast
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Renewal Bonus</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{(tse.renewalBonus / 1000).toFixed(1)}K
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Total Projected</span>
                      <span className="text-lg font-bold text-amber-600">
                        ₹{(tse.incentiveForecast / 1000).toFixed(1)}K
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Activity */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlertCircle className="w-3 h-3" />
                  Last activity:{" "}
                  {new Date(tse.lastActivity).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTSE(tse.id);
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
