/**
 * CM Renewal Funnel Visualization (V11)
 * Shows complete renewal journey: Active → Expiring → Renewed → Upgraded → Lapsed
 *
 * Purpose:
 * - Visualize renewal lifecycle from active customers to final outcome
 * - Track drop-off at renewal stage (lapsed customers)
 * - Show upgrade success rate
 * - Display revenue impact at each stage
 * - Identify top reasons for lapses
 */

import { ChevronRight, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { RenewalFunnelStage } from "../../types/clusterManager.types";

interface CMRenewalFunnelVisualizationProps {
  stages: RenewalFunnelStage[];
}

export function CMRenewalFunnelVisualization({ stages }: CMRenewalFunnelVisualizationProps) {
  const getStageColor = (stage: RenewalFunnelStage["stage"]) => {
    switch (stage) {
      case "ACTIVE":
        return "bg-blue-500";
      case "EXPIRING":
        return "bg-amber-500";
      case "RENEWED":
        return "bg-green-500";
      case "UPGRADED":
        return "bg-emerald-600";
      case "LAPSED":
        return "bg-red-500";
    }
  };

  const getStageLabel = (stage: RenewalFunnelStage["stage"]) => {
    switch (stage) {
      case "ACTIVE":
        return "Active Customers";
      case "EXPIRING":
        return "Expiring This Month";
      case "RENEWED":
        return "Successfully Renewed";
      case "UPGRADED":
        return "Upgraded at Renewal";
      case "LAPSED":
        return "Did Not Renew";
    }
  };

  const getDropOffSeverity = (percentage: number): "CRITICAL" | "WARNING" | "GOOD" => {
    if (percentage > 30) return "CRITICAL";
    if (percentage > 20) return "WARNING";
    return "GOOD";
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Renewal Lifecycle Funnel
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Active → Expiring → Renewed → Upgraded vs. Lapsed
        </p>
      </div>

      {/* Funnel Flow */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const nextStage = stages[index + 1];
          const dropOffSeverity = stage.dropOff && stage.dropOff > 0 ? getDropOffSeverity(stage.dropOffPercentage || 0) : "GOOD";
          const isLapsedStage = stage.stage === "LAPSED";

          return (
            <div key={stage.stage}>
              {/* Stage Card */}
              <div className="relative">
                <div className={`p-4 rounded-lg border-2 ${
                  isLapsedStage
                    ? "border-red-300 bg-red-50"
                    : dropOffSeverity === "CRITICAL" && stage.dropOff && stage.dropOff > 0
                    ? "border-amber-300 bg-amber-50"
                    : "border-gray-200 bg-white"
                }`}>
                  <div className="flex items-center justify-between">
                    {/* Stage Info */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className={`px-3 py-2 rounded-lg ${getStageColor(stage.stage)} text-white font-semibold`}>
                        {getStageLabel(stage.stage)}
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stage.count}</div>
                        {stage.dropOff !== undefined && stage.dropOff > 0 && (
                          <div className={`text-sm font-medium flex items-center gap-1 ${
                            isLapsedStage ? "text-red-600" :
                            dropOffSeverity === "CRITICAL" ? "text-amber-600" :
                            "text-gray-600"
                          }`}>
                            <TrendingDown className="h-4 w-4" />
                            {stage.dropOff} ({stage.dropOffPercentage?.toFixed(1)}% {isLapsedStage ? "lapsed" : "drop"})
                          </div>
                        )}
                        {stage.stage === "UPGRADED" && (
                          <div className="text-sm font-medium flex items-center gap-1 text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            Revenue expansion
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Revenue Badge */}
                    {stage.value !== undefined && (
                      <Badge className={`${
                        isLapsedStage
                          ? "bg-red-600 text-white"
                          : stage.stage === "UPGRADED"
                          ? "bg-emerald-600 text-white"
                          : stage.stage === "RENEWED"
                          ? "bg-green-600 text-white"
                          : "bg-gray-600 text-white"
                      } flex items-center gap-1 px-3 py-1`}>
                        <DollarSign className="h-4 w-4" />
                        ₹{(stage.value / 100000).toFixed(1)}L
                      </Badge>
                    )}
                  </div>

                  {/* Top Reasons */}
                  {stage.topReasons && stage.topReasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-600 mb-2">
                        {isLapsedStage ? "Top Lapse Reasons:" : "Key Factors:"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {stage.topReasons.slice(0, 4).map((reason, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={`text-xs ${
                              isLapsedStage
                                ? "border-red-300 text-red-700 bg-red-50"
                                : "border-gray-300 text-gray-700"
                            }`}
                          >
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Connector Arrow */}
                {nextStage && stage.stage !== "RENEWED" && (
                  <div className="flex items-center justify-center my-2">
                    <ChevronRight className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Renewal Rate</div>
            <div className="text-xl font-bold text-green-600">
              {((stages.find(s => s.stage === "RENEWED")?.count || 0) / (stages.find(s => s.stage === "EXPIRING")?.count || 1) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Expiring → Renewed</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Upgrade Rate</div>
            <div className="text-xl font-bold text-emerald-600">
              {((stages.find(s => s.stage === "UPGRADED")?.count || 0) / (stages.find(s => s.stage === "RENEWED")?.count || 1) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Renewed → Upgraded</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Lapse Rate</div>
            <div className="text-xl font-bold text-red-600">
              {((stages.find(s => s.stage === "LAPSED")?.count || 0) / (stages.find(s => s.stage === "EXPIRING")?.count || 1) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Did Not Renew</div>
          </div>
        </div>
      </div>

      {/* Warning Message */}
      {(() => {
        const expiringCount = stages.find(s => s.stage === "EXPIRING")?.count || 1;
        const lapsedCount = stages.find(s => s.stage === "LAPSED")?.count || 0;
        const lapseRate = (lapsedCount / expiringCount) * 100;

        if (lapseRate > 30) {
          return (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-900">
                  Critical Lapse Rate - Revenue Retention Risk
                </div>
                <div className="text-sm text-red-700 mt-1">
                  {lapseRate.toFixed(1)}% of customers are not renewing. Review TSM renewal protocols, pricing communication, and service quality. Primary lapse reason needs immediate attention.
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </Card>
  );
}
