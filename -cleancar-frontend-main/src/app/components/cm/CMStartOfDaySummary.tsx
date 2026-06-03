/**
 * CM Start of Day Summary (V12)
 * Morning briefing: Yesterday performance + Today priorities
 *
 * Purpose:
 * - Show yesterday's revenue vs target
 * - Highlight conversion → retention drop-offs
 * - Display renewals due today
 * - List critical alerts carried forward
 * - Set context for "where will today's performance break?"
 */

import { Calendar, TrendingUp, TrendingDown, AlertTriangle, Target, CheckCircle2 } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { StartOfDaySummary } from "../../types/clusterManager.types";

interface CMStartOfDaySummaryProps {
  summary: StartOfDaySummary;
}

export function CMStartOfDaySummary({ summary }: CMStartOfDaySummaryProps) {
  const getUrgencyColor = (urgency: "CRITICAL" | "HIGH" | "MEDIUM") => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-600 text-white";
      case "HIGH":
        return "bg-amber-600 text-white";
      case "MEDIUM":
        return "bg-blue-600 text-white";
    }
  };

  const yesterdayStatus = summary.yesterday.percentage >= 95 ? "GREEN" :
                          summary.yesterday.percentage >= 85 ? "AMBER" : "RED";

  return (
    <Card className="p-6 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50 to-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Start of Day Summary
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {summary.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Badge className="bg-blue-600 text-white">
          Morning Briefing
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Yesterday Performance */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Yesterday's Performance
          </h4>

          <div className="space-y-3">
            {/* Revenue */}
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Revenue</span>
                <Badge className={
                  yesterdayStatus === "GREEN" ? "bg-green-600 text-white" :
                  yesterdayStatus === "AMBER" ? "bg-amber-600 text-white" :
                  "bg-red-600 text-white"
                }>
                  {summary.yesterday.percentage.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-lg font-bold">
                ₹{(summary.yesterday.revenue / 100000).toFixed(2)}L
              </div>
              <div className="text-xs text-gray-500">
                Target: ₹{(summary.yesterday.revenueTarget / 100000).toFixed(2)}L
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white rounded border border-gray-200 text-center">
                <div className="text-xs text-gray-600">Units</div>
                <div className="text-base font-bold">{summary.yesterday.unitsCompleted}</div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200 text-center">
                <div className="text-xs text-gray-600">Conversions</div>
                <div className="text-base font-bold text-green-600">{summary.yesterday.conversions}</div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200 text-center">
                <div className="text-xs text-gray-600">Renewals</div>
                <div className="text-base font-bold text-blue-600">{summary.yesterday.renewals}</div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200 text-center">
                <div className="text-xs text-gray-600">Lapses</div>
                <div className="text-base font-bold text-red-600">{summary.yesterday.lapses}</div>
              </div>
            </div>

            {/* Conversion Drop-Off Alert */}
            {summary.conversionToRetentionDropOff.dropOffPercentage > 5 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-900">
                    Conversion → Retention Drop-Off
                  </span>
                </div>
                <div className="text-sm text-amber-700">
                  {summary.conversionToRetentionDropOff.dropOffCount} of {summary.conversionToRetentionDropOff.conversions} conversions
                  ({summary.conversionToRetentionDropOff.dropOffPercentage.toFixed(1)}%) did not stay active after 7 days
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Today's Priorities */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Today's Focus
          </h4>

          <div className="space-y-3">
            {/* Today Targets */}
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Revenue Target</div>
              <div className="text-lg font-bold">
                ₹{(summary.today.revenueTarget / 100000).toFixed(2)}L
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Expected: {summary.today.expectedConversions} conversions
              </div>
            </div>

            {/* Renewals Due */}
            {summary.today.renewalsDue > 0 && (
              <div className={`p-3 rounded-lg border ${
                summary.today.highRiskRenewals > 0
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">Renewals Due Today</span>
                  <Badge className={
                    summary.today.highRiskRenewals > 0
                      ? "bg-red-600 text-white"
                      : "bg-green-600 text-white"
                  }>
                    {summary.today.renewalsDue}
                  </Badge>
                </div>
                {summary.today.highRiskRenewals > 0 && (
                  <div className="text-sm text-red-700 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {summary.today.highRiskRenewals} high-risk for lapse
                  </div>
                )}
              </div>
            )}

            {/* Critical Alerts Carried Forward */}
            {summary.today.criticalAlertsCarriedForward > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-900">
                    Critical Alerts Pending
                  </span>
                </div>
                <div className="text-sm text-red-700">
                  {summary.today.criticalAlertsCarriedForward} unresolved from yesterday
                </div>
              </div>
            )}

            {/* Top Priorities */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-600 uppercase">Priority Actions</div>
              {summary.topPriorities.slice(0, 3).map((priority, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                  <span className="text-sm text-gray-900">{priority.category}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {priority.count}
                    </Badge>
                    <Badge className={`text-xs ${getUrgencyColor(priority.urgency)}`}>
                      {priority.urgency}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Message */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <span className="font-medium">CM Focus Today:</span>
          <span>Where will performance break? Monitor conversion → retention → renewal flow</span>
        </div>
      </div>
    </Card>
  );
}
