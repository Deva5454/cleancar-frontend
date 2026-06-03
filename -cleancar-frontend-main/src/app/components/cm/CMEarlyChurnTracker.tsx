/**
 * EARLY CHURN TRACKER (V8)
 * Tracks churn within 7/30/90 days to identify sales quality issues
 * Critical for identifying wrong plan selling and over-promising
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, TrendingDown, Clock } from "lucide-react";
import type { EarlyChurnMetrics } from "../../types/clusterManager.types";

interface CMEarlyChurnTrackerProps {
  metrics: EarlyChurnMetrics;
}

export function CMEarlyChurnTracker({ metrics }: CMEarlyChurnTrackerProps) {
  const getChurnSeverity = (percentage: number, days: number) => {
    if (days === 7 && percentage > 5) return "CRITICAL";
    if (days === 30 && percentage > 10) return "WARNING";
    if (days === 90 && percentage > 20) return "WARNING";
    return "NORMAL";
  };

  const getSeverityConfig = (severity: string) => {
    if (severity === "CRITICAL") {
      return {
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
        textColor: "text-red-900",
        badgeColor: "bg-red-600",
      };
    }
    if (severity === "WARNING") {
      return {
        bgColor: "bg-amber-50",
        borderColor: "border-amber-300",
        textColor: "text-amber-900",
        badgeColor: "bg-amber-600",
      };
    }
    return {
      bgColor: "bg-green-50",
      borderColor: "border-green-300",
      textColor: "text-green-900",
      badgeColor: "bg-green-600",
    };
  };

  const churn7Severity = getChurnSeverity(metrics.churn7Days.percentage, 7);
  const churn30Severity = getChurnSeverity(metrics.churn30Days.percentage, 30);

  return (
    <Card className="p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Early Churn Tracking</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          Sales Quality Indicator
        </Badge>
      </div>

      {/* Churn by Timeline */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* 7-Day Churn */}
        <div className={`p-4 rounded-lg border-2 ${getSeverityConfig(churn7Severity).borderColor} ${getSeverityConfig(churn7Severity).bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold">7-Day Churn</span>
            </div>
            {churn7Severity === "CRITICAL" && (
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.churn7Days.count}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`${getSeverityConfig(churn7Severity).badgeColor} text-white text-xs`}>
              {metrics.churn7Days.percentage.toFixed(1)}%
            </Badge>
            {churn7Severity === "CRITICAL" && (
              <span className="text-xs text-red-700 font-medium">Above threshold!</span>
            )}
          </div>
        </div>

        {/* 30-Day Churn */}
        <div className={`p-4 rounded-lg border-2 ${getSeverityConfig(churn30Severity).borderColor} ${getSeverityConfig(churn30Severity).bgColor}`}>
          <div className="flex items-center gap-1 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold">30-Day Churn</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.churn30Days.count}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`${getSeverityConfig(churn30Severity).badgeColor} text-white text-xs`}>
              {metrics.churn30Days.percentage.toFixed(1)}%
            </Badge>
            {churn30Severity === "WARNING" && (
              <span className="text-xs text-amber-700 font-medium">Monitor closely</span>
            )}
          </div>
        </div>

        {/* 90-Day Churn */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold">90-Day Churn</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.churn90Days.count}</p>
          <Badge variant="outline" className="text-xs mt-1">
            {metrics.churn90Days.percentage.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Top Churn Reasons (7-Day Focus) */}
      {metrics.churn7Days.count > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">
            7-Day Churn Reasons (Sales Quality Signals)
          </h4>
          <div className="space-y-2">
            {metrics.churn7Days.topReasons.map((reason, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs"
              >
                <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0" />
                <span className="text-red-900">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Churn by Deal Type */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Churn by Deal Type (90-Day)</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-slate-600"></div>
              <span className="text-sm text-slate-900">Base</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2 w-32">
                <div
                  className="bg-slate-600 rounded-full h-2"
                  style={{ width: `${Math.min(metrics.byDealType.base, 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                {metrics.byDealType.base.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-blue-600"></div>
              <span className="text-sm text-slate-900">Add-On</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2 w-32">
                <div
                  className="bg-blue-600 rounded-full h-2"
                  style={{ width: `${Math.min(metrics.byDealType.addOn, 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                {metrics.byDealType.addOn.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-green-600"></div>
              <span className="text-sm text-slate-900">Bundle MID</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2 w-32">
                <div
                  className="bg-green-600 rounded-full h-2"
                  style={{ width: `${Math.min(metrics.byDealType.bundleMID, 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                {metrics.byDealType.bundleMID.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-amber-600"></div>
              <span className="text-sm text-slate-900">Bundle LOW</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2 w-32">
                <div
                  className={`${
                    metrics.byDealType.bundleLOW > 20 ? "bg-red-600" : "bg-amber-600"
                  } rounded-full h-2`}
                  style={{ width: `${Math.min(metrics.byDealType.bundleLOW, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-1 w-12 justify-end">
                <span className="text-sm font-semibold text-slate-900">
                  {metrics.byDealType.bundleLOW.toFixed(1)}%
                </span>
                {metrics.byDealType.bundleLOW > 20 && (
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {metrics.byDealType.bundleLOW > 20 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-red-900">HIGH LOW Bundle Churn Risk:</span>
                <span className="text-red-800 ml-1">
                  {metrics.byDealType.bundleLOW.toFixed(1)}% of LOW bundle customers churning - significantly above acceptable threshold. Review value proposition or reduce dependency.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
