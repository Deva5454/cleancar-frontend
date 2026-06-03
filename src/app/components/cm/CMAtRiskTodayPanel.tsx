/**
 * CM At Risk Today Panel (V12)
 * Midday pipeline health and risk indicators
 *
 * Purpose:
 * - Identify low conversion clusters
 * - Highlight follow-up gaps (CRM issues)
 * - Track revenue pacing vs target
 * - Show pipeline risks (stalled deals, SLA breaches)
 * - Answer: "Where will today's performance break?"
 */

import { AlertTriangle, TrendingDown, Clock, DollarSign, Target } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { AtRiskTodayPanel } from "../../types/clusterManager.types";

interface CMAtRiskTodayPanelProps {
  data: AtRiskTodayPanel;
}

export function CMAtRiskTodayPanel({ data }: CMAtRiskTodayPanelProps) {
  const getRevenuePacingColor = (status: AtRiskTodayPanel["revenuePacing"]["status"]) => {
    switch (status) {
      case "ON_TRACK":
        return "text-green-600 bg-green-50 border-green-200";
      case "AT_RISK":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "CRITICAL":
        return "text-red-600 bg-red-50 border-red-200";
    }
  };

  return (
    <Card className="p-6 border-l-4 border-l-amber-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            At Risk Today
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Midday Pipeline Health • Where Performance Will Break
          </p>
        </div>
        <Badge className="bg-amber-600 text-white flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Live Monitoring
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column: Conversion & Follow-up Issues */}
        <div className="space-y-4">
          {/* Low Conversion Clusters */}
          {data.lowConversionClusters.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Low Conversion Clusters
              </h4>
              <div className="space-y-2">
                {data.lowConversionClusters.map((cluster) => (
                  <div
                    key={cluster.omId}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{cluster.omName}</span>
                      <Badge className="bg-red-600 text-white">
                        {cluster.conversionRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Target: {cluster.target.toFixed(1)}%</span>
                      <span className="text-red-600 font-semibold">
                        -{cluster.gapPercentage.toFixed(1)}% gap
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-red-500 rounded-full h-2"
                        style={{ width: `${(cluster.conversionRate / cluster.target) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Gaps (CRM Issue) */}
          {data.followUpGaps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Follow-up Gaps (CRM)
              </h4>
              <div className="space-y-2">
                {data.followUpGaps.map((gap) => (
                  <div
                    key={gap.omId}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{gap.omName}</span>
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                        CRM Issue
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Missed Follow-ups:</span>
                        <span className="font-semibold text-red-600 ml-1">{gap.missedFollowUps}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">CRM Score:</span>
                        <span className={`font-semibold ml-1 ${
                          gap.crmComplianceScore >= 85 ? "text-green-600" :
                          gap.crmComplianceScore >= 70 ? "text-amber-600" :
                          "text-red-600"
                        }`}>
                          {gap.crmComplianceScore.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Revenue & Pipeline */}
        <div className="space-y-4">
          {/* Revenue Pacing */}
          <div className={`p-4 rounded-lg border ${getRevenuePacingColor(data.revenuePacing.status)}`}>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Revenue Pacing
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Current vs Target</span>
                  <Badge className={
                    data.revenuePacing.status === "ON_TRACK" ? "bg-green-600 text-white" :
                    data.revenuePacing.status === "AT_RISK" ? "bg-amber-600 text-white" :
                    "bg-red-600 text-white"
                  }>
                    {data.revenuePacing.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold">
                  ₹{(data.revenuePacing.current / 100000).toFixed(2)}L
                </div>
                <div className="text-sm text-gray-600">
                  Target: ₹{(data.revenuePacing.target / 100000).toFixed(2)}L
                </div>
              </div>

              {data.revenuePacing.status !== "ON_TRACK" && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-900">
                      Projected Shortfall: ₹{(data.revenuePacing.projectedShortfall / 100000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Risks */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Pipeline Risk Indicators</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stalled Deals</span>
                <Badge variant="outline" className={
                  data.pipelineRisks.stalledDeals > 5 ? "border-red-300 text-red-700" : "border-gray-300"
                }>
                  {data.pipelineRisks.stalledDeals}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">SLA Breaches (Total)</span>
                <Badge variant="outline" className={
                  data.pipelineRisks.slaBreaches > 50 ? "border-red-300 text-red-700" : "border-amber-300 text-amber-700"
                }>
                  {data.pipelineRisks.slaBreaches}
                </Badge>
              </div>
              <div className="pt-2 border-t border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">High-Value at Risk</span>
                  <span className="text-base font-bold text-red-600">
                    ₹{(data.pipelineRisks.highValueAtRisk / 100000).toFixed(1)}L
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Review Intervention Center
          </Button>
        </div>
      </div>

      {/* Critical Warning */}
      {data.revenuePacing.status === "CRITICAL" && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-red-900">
              Critical Revenue Gap - Immediate Action Required
            </div>
            <div className="text-sm text-red-700 mt-1">
              Revenue pacing at {data.revenuePacing.percentage.toFixed(1)}%. Review low-performing OMs and stalled pipeline. Consider escalation to City Manager.
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
