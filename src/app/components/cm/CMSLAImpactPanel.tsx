/**
 * CM SLA Impact Panel (V10 - TSM Integration)
 * Shows impact of SLA breaches on conversion and revenue
 *
 * Purpose:
 * - Display TSM funnel governance data
 * - Show SLA breach rate and conversion impact
 * - Track revenue loss from poor lead handling
 * - Identify OMs with high SLA breach patterns
 */

import { AlertTriangle, TrendingDown, DollarSign, Clock } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { SLAImpactMetrics } from "../../types/clusterManager.types";

interface CMSLAImpactPanelProps {
  metrics: SLAImpactMetrics;
}

export function CMSLAImpactPanel({ metrics }: CMSLAImpactPanelProps) {
  const getBreachRateSeverity = (rate: number): "CRITICAL" | "WARNING" | "GOOD" => {
    if (rate > 25) return "CRITICAL";
    if (rate > 15) return "WARNING";
    return "GOOD";
  };

  const getConversionGapSeverity = (gap: number): "CRITICAL" | "WARNING" | "GOOD" => {
    if (gap > 15) return "CRITICAL";
    if (gap > 8) return "WARNING";
    return "GOOD";
  };

  const getTrendColor = (trend: SLAImpactMetrics["breachTrend"]) => {
    switch (trend) {
      case "IMPROVING":
        return "text-green-600 bg-green-50";
      case "STABLE":
        return "text-amber-600 bg-amber-50";
      case "WORSENING":
        return "text-red-600 bg-red-50";
    }
  };

  const breachSeverity = getBreachRateSeverity(metrics.slaBreachRate);
  const gapSeverity = getConversionGapSeverity(metrics.conversionImpact.gap);

  return (
    <Card className="p-6 border-l-4 border-l-purple-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            SLA Impact on Conversion
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            TSM Funnel Governance • Lead Handling Quality
          </p>
        </div>
        <Badge className={getTrendColor(metrics.breachTrend)}>
          {metrics.breachTrend}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* SLA Breach Rate */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">SLA Breach Rate</div>
          <div className={`text-2xl font-bold ${
            breachSeverity === "CRITICAL" ? "text-red-600" :
            breachSeverity === "WARNING" ? "text-amber-600" :
            "text-green-600"
          }`}>
            {metrics.slaBreachRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {breachSeverity === "CRITICAL" && "Critical level"}
            {breachSeverity === "WARNING" && "Above threshold"}
            {breachSeverity === "GOOD" && "Within limits"}
          </div>
        </div>

        {/* Conversion Gap */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Conversion Gap</div>
          <div className={`text-2xl font-bold flex items-center gap-1 ${
            gapSeverity === "CRITICAL" ? "text-red-600" :
            gapSeverity === "WARNING" ? "text-amber-600" :
            "text-green-600"
          }`}>
            <TrendingDown className="h-5 w-5" />
            {metrics.conversionImpact.gap.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.conversionImpact.withSLA.toFixed(1)}% (SLA met) vs {metrics.conversionImpact.withoutSLA.toFixed(1)}% (breached)
          </div>
        </div>

        {/* Revenue Impact */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Revenue Loss</div>
          <div className="text-2xl font-bold text-red-600 flex items-center gap-1">
            <DollarSign className="h-5 w-5" />
            ₹{(metrics.revenueImpact.estimatedLoss / 100000).toFixed(1)}L
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.revenueImpact.affectedDeals} deals affected
          </div>
        </div>

        {/* Benchmark */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">With SLA Met</div>
          <div className="text-2xl font-bold text-green-600">
            {metrics.conversionImpact.withSLA.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Target conversion rate
          </div>
        </div>
      </div>

      {/* OM Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">SLA Breach Impact by OM</h4>
          <Badge variant="outline" className="text-xs">
            Data Source: TSM / Funnel
          </Badge>
        </div>

        <div className="space-y-2">
          {metrics.byOM
            .filter(om => om.impact !== "LOW")
            .sort((a, b) => b.breachCount - a.breachCount)
            .slice(0, 5)
            .map((om) => (
              <div
                key={om.omId}
                className={`p-3 rounded-lg border ${
                  om.impact === "HIGH"
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
                          om.impact === "HIGH"
                            ? "bg-red-600 text-white"
                            : "bg-amber-600 text-white"
                        }
                      >
                        {om.impact}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {om.breachCount} SLA breaches • {om.conversionRate.toFixed(1)}% conversion rate
                    </div>
                  </div>
                  {om.impact === "HIGH" && (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Warning Message */}
        {breachSeverity === "CRITICAL" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-red-900">
                Critical SLA Breach Pattern Detected
              </div>
              <div className="text-sm text-red-700 mt-1">
                Review TSM first-call discipline. {metrics.conversionImpact.gap.toFixed(1)}% conversion gap is causing significant revenue loss. Coordinate with TSM to strengthen lead follow-up protocols.
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
