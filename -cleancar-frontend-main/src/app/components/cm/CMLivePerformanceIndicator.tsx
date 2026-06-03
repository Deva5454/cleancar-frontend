/**
 * CM Live Performance Indicator (V12)
 * Real-time intra-day performance tracking
 *
 * Purpose:
 * - Show live conversion trend (improving/stable/declining)
 * - Track conversions so far vs target
 * - Monitor revenue pacing
 * - Flag SLA breaches and early churn signals
 * - Compact, always-visible indicator
 */

import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { LivePerformanceIndicator } from "../../types/clusterManager.types";

interface CMLivePerformanceIndicatorProps {
  indicator: LivePerformanceIndicator;
}

export function CMLivePerformanceIndicator({ indicator }: CMLivePerformanceIndicatorProps) {
  const getTrendIcon = () => {
    switch (indicator.intraDayConversionTrend) {
      case "IMPROVING":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "DECLINING":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "STABLE":
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (indicator.intraDayConversionTrend) {
      case "IMPROVING":
        return "text-green-600 bg-green-50 border-green-200";
      case "DECLINING":
        return "text-red-600 bg-red-50 border-red-200";
      case "STABLE":
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const conversionProgress = (indicator.conversionsSoFar / indicator.conversionTarget) * 100;
  const revenueProgress = (indicator.revenueSoFar / indicator.revenueTarget) * 100;

  return (
    <Card className="p-4 border border-gray-200 bg-gradient-to-r from-white to-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">Live Performance</h4>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs border ${getTrendColor()}`}>
            {getTrendIcon()}
            {indicator.intraDayConversionTrend}
          </Badge>
          <span className="text-xs text-gray-500">
            {indicator.lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* Conversions */}
        <div>
          <div className="text-xs text-gray-600 mb-1">Conversions</div>
          <div className="text-lg font-bold text-gray-900">{indicator.conversionsSoFar}</div>
          <div className="text-xs text-gray-500">/ {indicator.conversionTarget}</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className={`rounded-full h-1.5 ${
                conversionProgress >= 100 ? "bg-green-500" :
                conversionProgress >= 70 ? "bg-blue-500" :
                "bg-amber-500"
              }`}
              style={{ width: `${Math.min(conversionProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Revenue */}
        <div>
          <div className="text-xs text-gray-600 mb-1">Revenue</div>
          <div className="text-lg font-bold text-gray-900">
            ₹{(indicator.revenueSoFar / 100000).toFixed(1)}L
          </div>
          <div className="text-xs text-gray-500">
            / ₹{(indicator.revenueTarget / 100000).toFixed(0)}L
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className={`rounded-full h-1.5 ${
                revenueProgress >= 100 ? "bg-green-500" :
                revenueProgress >= 80 ? "bg-blue-500" :
                "bg-amber-500"
              }`}
              style={{ width: `${Math.min(revenueProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* SLA Breaches */}
        <div>
          <div className="text-xs text-gray-600 mb-1">SLA Breaches</div>
          <div className={`text-lg font-bold ${
            indicator.slaBreachesToday > 20 ? "text-red-600" :
            indicator.slaBreachesToday > 10 ? "text-amber-600" :
            "text-gray-900"
          }`}>
            {indicator.slaBreachesToday}
          </div>
          <div className="text-xs text-gray-500">Today</div>
          {indicator.slaBreachesToday > 20 && (
            <div className="mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-600 font-medium">High</span>
            </div>
          )}
        </div>

        {/* Early Churn Signals */}
        <div>
          <div className="text-xs text-gray-600 mb-1">Early Churn</div>
          <div className={`text-lg font-bold ${
            indicator.earlyChurnSignals > 10 ? "text-red-600" :
            indicator.earlyChurnSignals > 5 ? "text-amber-600" :
            "text-gray-900"
          }`}>
            {indicator.earlyChurnSignals}
          </div>
          <div className="text-xs text-gray-500">7-day</div>
          {indicator.earlyChurnSignals > 10 && (
            <div className="mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-600 font-medium">Alert</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
