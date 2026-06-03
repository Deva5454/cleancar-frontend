/**
 * CONVERSION QUALITY PANEL (V8)
 * Shows TSE sales outcomes without exposing CRM screens
 * Focus: Deal mix, conversion rate, early signals
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { TrendingUp, TrendingDown, PieChart, DollarSign, AlertTriangle } from "lucide-react";
import type { ConversionQualityMetrics } from "../../types/clusterManager.types";

interface CMConversionQualityPanelProps {
  metrics: ConversionQualityMetrics;
}

export function CMConversionQualityPanel({ metrics }: CMConversionQualityPanelProps) {
  const getDealMixColor = (type: string) => {
    if (type === "bundleMID") return "bg-green-600";
    if (type === "bundleLOW") return "bg-amber-600";
    if (type === "addOn") return "bg-blue-600";
    return "bg-slate-600";
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  return (
    <Card className="p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Conversion Quality</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          Data Source: Sales (CRM)
        </Badge>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <span className="text-xs text-blue-700">Total Conversions</span>
          <p className="text-2xl font-bold text-blue-900">{metrics.totalConversions}</p>
          <div className="flex items-center gap-1 text-xs mt-1">
            {getTrendIcon(metrics.monthOverMonth.conversions)}
            <span className={metrics.monthOverMonth.conversions >= 0 ? "text-green-600" : "text-red-600"}>
              {metrics.monthOverMonth.conversions >= 0 ? "+" : ""}
              {metrics.monthOverMonth.conversions.toFixed(1)}% MoM
            </span>
          </div>
        </div>

        <div className="p-3 bg-green-50 rounded-lg">
          <span className="text-xs text-green-700">Conversion Rate</span>
          <p className="text-2xl font-bold text-green-900">{metrics.conversionRate.toFixed(1)}%</p>
          <span className="text-xs text-green-700">From demos</span>
        </div>

        <div className="p-3 bg-purple-50 rounded-lg">
          <span className="text-xs text-purple-700">Avg Deal Value</span>
          <div className="flex items-center gap-1">
            <DollarSign className="w-5 h-5 text-purple-900" />
            <p className="text-2xl font-bold text-purple-900">
              {(metrics.averageDealValue / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs mt-1">
            {getTrendIcon(metrics.monthOverMonth.avgValue)}
            <span className={metrics.monthOverMonth.avgValue >= 0 ? "text-green-600" : "text-red-600"}>
              {metrics.monthOverMonth.avgValue >= 0 ? "+" : ""}
              {metrics.monthOverMonth.avgValue.toFixed(1)}% MoM
            </span>
          </div>
        </div>
      </div>

      {/* Deal Mix Breakdown */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Deal Mix Breakdown</h4>

        {/* Visual Bar */}
        <div className="flex h-8 rounded-lg overflow-hidden mb-3">
          <div
            className="bg-slate-600 flex items-center justify-center text-xs text-white font-medium"
            style={{ width: `${metrics.dealMix.base.percentage}%` }}
          >
            {metrics.dealMix.base.percentage >= 10 && `${metrics.dealMix.base.percentage.toFixed(0)}%`}
          </div>
          <div
            className="bg-blue-600 flex items-center justify-center text-xs text-white font-medium"
            style={{ width: `${metrics.dealMix.addOn.percentage}%` }}
          >
            {metrics.dealMix.addOn.percentage >= 10 && `${metrics.dealMix.addOn.percentage.toFixed(0)}%`}
          </div>
          <div
            className="bg-green-600 flex items-center justify-center text-xs text-white font-medium"
            style={{ width: `${metrics.dealMix.bundleMID.percentage}%` }}
          >
            {metrics.dealMix.bundleMID.percentage >= 10 && `${metrics.dealMix.bundleMID.percentage.toFixed(0)}%`}
          </div>
          <div
            className="bg-amber-600 flex items-center justify-center text-xs text-white font-medium"
            style={{ width: `${metrics.dealMix.bundleLOW.percentage}%` }}
          >
            {metrics.dealMix.bundleLOW.percentage >= 10 && `${metrics.dealMix.bundleLOW.percentage.toFixed(0)}%`}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-600"></div>
            <div className="text-xs">
              <div className="font-medium text-slate-900">Base</div>
              <div className="text-slate-600">{metrics.dealMix.base.count} deals</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-600"></div>
            <div className="text-xs">
              <div className="font-medium text-slate-900">Add-On</div>
              <div className="text-slate-600">{metrics.dealMix.addOn.count} deals</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-600"></div>
            <div className="text-xs">
              <div className="font-medium text-slate-900">Bundle MID</div>
              <div className="text-slate-600">{metrics.dealMix.bundleMID.count} deals</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-600"></div>
            <div className="text-xs">
              <div className="font-medium text-slate-900">Bundle LOW</div>
              <div className="text-slate-600">{metrics.dealMix.bundleLOW.count} deals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning: Avg Value Declining */}
      {metrics.monthOverMonth.avgValue < 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-red-900">Quality Alert:</span>
            <span className="text-red-800 ml-1">
              Average deal value declining despite conversion growth - possible quality degradation or excessive LOW bundle dependency
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
