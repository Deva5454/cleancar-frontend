/**
 * CM Funnel Visualization (V10 - TSM Integration)
 * Complete customer journey: Leads → Attempts → Conversions → Active → Retained → Renewed
 *
 * Purpose:
 * - Visualize complete funnel from lead to renewal
 * - Show drop-off points and SLA breach impact
 * - Identify where pipeline is leaking
 * - Track top reasons for drop-offs at each stage
 */

import { ChevronRight, AlertTriangle } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { FunnelStageMetrics } from "../../types/clusterManager.types";

interface CMFunnelVisualizationProps {
  stages: FunnelStageMetrics[];
}

export function CMFunnelVisualization({ stages }: CMFunnelVisualizationProps) {
  const getDropOffSeverity = (percentage: number): "CRITICAL" | "WARNING" | "GOOD" => {
    if (percentage > 40) return "CRITICAL";
    if (percentage > 25) return "WARNING";
    return "GOOD";
  };

  const getStageColor = (stage: FunnelStageMetrics["stage"]) => {
    switch (stage) {
      case "LEADS":
        return "bg-blue-500";
      case "ATTEMPTS":
        return "bg-indigo-500";
      case "CONVERSIONS":
        return "bg-purple-500";
      case "ACTIVE":
        return "bg-green-500";
      case "RETAINED":
        return "bg-teal-500";
      case "RENEWED":
        return "bg-emerald-600";
    }
  };

  const getStageLabel = (stage: FunnelStageMetrics["stage"]) => {
    switch (stage) {
      case "LEADS":
        return "Leads";
      case "ATTEMPTS":
        return "First Call Attempts";
      case "CONVERSIONS":
        return "Conversions";
      case "ACTIVE":
        return "Active (7d)";
      case "RETAINED":
        return "Retained (30d)";
      case "RENEWED":
        return "Renewed";
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Complete Customer Funnel
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          TSM → Sales → Operations → Retention Journey
        </p>
      </div>

      {/* Funnel Flow */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const nextStage = stages[index + 1];
          const dropOffSeverity = stage.dropOff > 0 ? getDropOffSeverity(stage.dropOffPercentage) : "GOOD";
          const hasSLAImpact = stage.slaBreachImpact && stage.slaBreachImpact > 0;

          return (
            <div key={stage.stage}>
              {/* Stage Card */}
              <div className="relative">
                <div className={`p-4 rounded-lg border-2 ${
                  dropOffSeverity === "CRITICAL" && stage.dropOff > 0
                    ? "border-red-300 bg-red-50"
                    : dropOffSeverity === "WARNING" && stage.dropOff > 0
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
                        {stage.dropOff > 0 && (
                          <div className={`text-sm font-medium ${
                            dropOffSeverity === "CRITICAL" ? "text-red-600" :
                            dropOffSeverity === "WARNING" ? "text-amber-600" :
                            "text-gray-600"
                          }`}>
                            ↓ {stage.dropOff} ({stage.dropOffPercentage.toFixed(1)}% drop)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SLA Impact Badge */}
                    {hasSLAImpact && (
                      <Badge className="bg-red-600 text-white flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {stage.slaBreachImpact} SLA breaches
                      </Badge>
                    )}
                  </div>

                  {/* Top Reasons */}
                  {stage.topReasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-600 mb-2">
                        {stage.dropOff > 0 ? "Top Drop-Off Reasons:" : "Key Factors:"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {stage.topReasons.slice(0, 3).map((reason, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={`text-xs ${
                              reason.toLowerCase().includes("sla")
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
                {nextStage && (
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
            <div className="text-sm text-gray-600">Overall Conversion</div>
            <div className="text-xl font-bold text-purple-600">
              {((stages.find(s => s.stage === "CONVERSIONS")?.count || 0) / (stages.find(s => s.stage === "LEADS")?.count || 1) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Lead → Conversion</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Retention Rate</div>
            <div className="text-xl font-bold text-teal-600">
              {((stages.find(s => s.stage === "RETAINED")?.count || 0) / (stages.find(s => s.stage === "ACTIVE")?.count || 1) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Active → 30d Retained</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Renewal Rate</div>
            <div className="text-xl font-bold text-emerald-600">
              {((stages.find(s => s.stage === "RENEWED")?.count || 0) / (stages.find(s => s.stage === "RETAINED")?.count || 1) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Retained → Renewed</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
