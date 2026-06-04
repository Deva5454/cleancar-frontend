/**
 * CM Renewal Health Panel (V11)
 * Complete renewal lifecycle visibility - critical revenue retention metric
 *
 * Purpose:
 * - Track renewal rate and upgrade rate
 * - Monitor expiring renewals and at-risk accounts
 * - Show revenue retention vs. revenue lost
 * - Identify OMs with renewal performance issues
 * - Display lapsed customer reason breakdown
 */

import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar, ArrowUpCircle } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { RenewalHealthMetrics } from "../../types/clusterManager.types";

interface CMRenewalHealthPanelProps {
  metrics: RenewalHealthMetrics;
}

export function CMRenewalHealthPanel({ metrics }: CMRenewalHealthPanelProps) {
  const getRenewalRateSeverity = (rate: number): "CRITICAL" | "WARNING" | "GOOD" => {
    if (rate < 65) return "CRITICAL";
    if (rate < 75) return "WARNING";
    return "GOOD";
  };

  const getUpgradeRateSeverity = (rate: number): "LOW" | "MEDIUM" | "GOOD" => {
    if (rate < 20) return "LOW";
    if (rate < 30) return "MEDIUM";
    return "GOOD";
  };

  const getTrendIcon = (trend: RenewalHealthMetrics["renewalTrend"]) => {
    switch (trend) {
      case "IMPROVING":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "STABLE":
        return <TrendingUp className="h-5 w-5 text-gray-600" />;
      case "DECLINING":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
  };

  const getTrendColor = (trend: RenewalHealthMetrics["renewalTrend"]) => {
    switch (trend) {
      case "IMPROVING":
        return "text-green-600 bg-green-50 border-green-200";
      case "STABLE":
        return "text-gray-600 bg-gray-50 border-gray-200";
      case "DECLINING":
        return "text-red-600 bg-red-50 border-red-200";
    }
  };

  const renewalSeverity = getRenewalRateSeverity(metrics.renewalRate);
  const upgradeSeverity = getUpgradeRateSeverity(metrics.upgradeRate);

  return (
    <Card className="p-6 border-l-4 border-l-emerald-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
            Renewal Health & Revenue Retention
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Complete Lifecycle: Active → Expiring → Renewed → Upgraded
          </p>
        </div>
        <Badge className={`flex items-center gap-1 border ${getTrendColor(metrics.renewalTrend)}`}>
          {getTrendIcon(metrics.renewalTrend)}
          {metrics.renewalTrend}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Renewal Rate */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Renewal Rate</div>
          <div className={`text-2xl font-bold ${
            renewalSeverity === "CRITICAL" ? "text-red-600" :
            renewalSeverity === "WARNING" ? "text-amber-600" :
            "text-green-600"
          }`}>
            {metrics.renewalRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {renewalSeverity === "CRITICAL" && "Critical - Below 65%"}
            {renewalSeverity === "WARNING" && "Warning - Below 75%"}
            {renewalSeverity === "GOOD" && "Healthy"}
          </div>
        </div>

        {/* Upgrade Rate */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Upgrade Rate</div>
          <div className={`text-2xl font-bold flex items-center gap-1 ${
            upgradeSeverity === "GOOD" ? "text-green-600" :
            upgradeSeverity === "MEDIUM" ? "text-amber-600" :
            "text-gray-600"
          }`}>
            <ArrowUpCircle className="h-5 w-5" />
            {metrics.upgradeRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {upgradeSeverity === "GOOD" && "Strong upsell"}
            {upgradeSeverity === "MEDIUM" && "Moderate upsell"}
            {upgradeSeverity === "LOW" && "Low upsell opportunity"}
          </div>
        </div>

        {/* Revenue Retained */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600 mb-1">Revenue Retained</div>
          <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
            <DollarSign className="h-5 w-5" />
            ₹{(metrics.retentionValue / 100000).toFixed(1)}L
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Through renewals this month
          </div>
        </div>

        {/* Revenue Lost */}
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-gray-600 mb-1">Revenue Lost</div>
          <div className="text-2xl font-bold text-red-600 flex items-center gap-1">
            <TrendingDown className="h-5 w-5" />
            ₹{(metrics.lapsedValue / 100000).toFixed(1)}L
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Lapsed customers this month
          </div>
        </div>
      </div>

      {/* Expiring Next 30 Days - At Risk */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            <h4 className="text-sm font-semibold text-gray-700">Expiring Next 30 Days</h4>
          </div>
          <Badge className="bg-amber-600 text-white">
            {metrics.expiringNext30Days.count} renewals due
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div>
            <div className="text-xs text-gray-600">Total Count</div>
            <div className="text-lg font-bold text-gray-900">{metrics.expiringNext30Days.count}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Revenue at Risk</div>
            <div className="text-lg font-bold text-gray-900">₹{(metrics.expiringNext30Days.value / 100000).toFixed(1)}L</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">High-Risk for Lapse</div>
            <div className="text-lg font-bold text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {metrics.expiringNext30Days.highRiskCount}
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Performance by OM */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Renewal Performance by OM</h4>
          <Badge variant="outline" className="text-xs">
            Data Source: Renewal / CRM
          </Badge>
        </div>

        <div className="space-y-2">
          {metrics.byOM
            .filter(om => om.status === "RED" || om.renewalRate < 70)
            .sort((a, b) => a.renewalRate - b.renewalRate)
            .map((om) => (
              <div
                key={om.omId}
                className={`p-3 rounded-lg border ${
                  om.status === "RED"
                    ? "bg-red-50 border-red-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{om.omName}</span>
                      <Badge
                        className={
                          om.status === "RED"
                            ? "bg-red-600 text-white"
                            : "bg-amber-600 text-white"
                        }
                      >
                        {om.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Renewal: {om.renewalRate.toFixed(1)}% • Upgrade: {om.upgradeRate.toFixed(1)}%
                    </div>
                  </div>
                  {om.status === "RED" && (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            ))}

          {metrics.byOM.filter(om => om.status === "RED" || om.renewalRate < 70).length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              All OMs meeting renewal targets
            </div>
          )}
        </div>
      </div>

      {/* Lapsed Customer Reason Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Lapse Reasons</h4>
        <div className="space-y-2">
          {metrics.lapsedReasonBreakdown.slice(0, 4).map((reason, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{reason.reason}</span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge variant="outline" className="text-xs">
                    {reason.count} customers
                  </Badge>
                  <span className="text-sm font-semibold text-red-600">
                    ₹{(reason.revenueImpact / 100000).toFixed(1)}L lost
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 rounded-full h-2"
                  style={{ width: `${reason.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Warning */}
      {renewalSeverity === "CRITICAL" && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-red-900">
              Critical Renewal Rate - Immediate Action Required
            </div>
            <div className="text-sm text-red-700 mt-1">
              Renewal rate at {metrics.renewalRate.toFixed(1)}% is below critical threshold (65%). Review TSM renewal protocols, pricing strategy, and customer satisfaction. Focus on {metrics.expiringNext30Days.highRiskCount} high-risk renewals in next 30 days.
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
