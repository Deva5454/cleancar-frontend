/**
 * TSM REPORTS & ANALYTICS
 * Comprehensive pipeline analytics and performance insights
 *
 * Philosophy: Data-driven decision making
 * Shows: Lead source performance, conversion funnels, bundle trends, TSE rankings
 * Purpose: Strategic insights for pipeline optimization
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  DollarSign,
  Target,
  Users,
  BarChart3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { teleSalesManagerService } from "../../services/teleSalesManagerService";

export function TSMReportsAnalytics() {
  const analytics = teleSalesManagerService.getAnalytics();

  // Calculate overall metrics
  const overallMetrics = {
    totalLeads: analytics.leadSourcePerformance.reduce(
      (sum, s) => sum + s.totalLeads,
      0
    ),
    totalConversions: analytics.leadSourcePerformance.reduce(
      (sum, s) => sum + s.conversions,
      0
    ),
    totalRevenue: analytics.leadSourcePerformance.reduce(
      (sum, s) => sum + s.revenue,
      0
    ),
    overallConversionRate:
      (analytics.leadSourcePerformance.reduce(
        (sum, s) => sum + s.conversions,
        0
      ) /
        analytics.leadSourcePerformance.reduce(
          (sum, s) => sum + s.totalLeads,
          0
        )) *
      100,
  };

  const getStatusColor = (status: string) => {
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

  return (
    <div className="space-y-6">
      {/* Overall Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div className="text-xs text-gray-600">Total Leads (MTD)</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {overallMetrics.totalLeads}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div className="text-xs text-gray-600">Total Conversions</div>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {overallMetrics.totalConversions}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <div className="text-xs text-gray-600">Source-Weighted Conversion Rate</div>
          {/* H3 FIX: this is conversion/totalLeads; dashboard shows TSE-avg — different methods */}
          </div>
          <div className="text-3xl font-bold text-indigo-600">
            {overallMetrics.overallConversionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-amber-600 mt-1">
            {/* H3 FIX: note methodology differs from dashboard (42.3% TSE-avg vs {rate}% here) */}
            Lead-to-conversion ratio (differs from TSE avg on dashboard)
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div className="text-xs text-gray-600">Total Revenue (MTD)</div>
          </div>
          <div className="text-3xl font-bold text-green-600">
            ₹{(overallMetrics.totalRevenue / 100000).toFixed(1)}L
          </div>
        </Card>
      </div>

      {/* Lead Source Performance */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Lead Source Performance
        </h2>
        <div className="space-y-3">
          {analytics.leadSourcePerformance.map((source) => (
            <div
              key={source.source}
              className={`p-4 rounded-lg border ${
                source.source === "WALK_IN"
                  ? "bg-amber-50 border-amber-200"  // H4 FIX: walk-in is a different channel
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {source.source}
                      {/* H4 FIX: flag walk-in as non-TSE channel */}
                      {source.source === "WALK_IN" && (
                        <span className="ml-2 text-xs font-normal text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Walk-in channel — excludes TSE pipeline
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {source.totalLeads} leads • {source.conversions} conversions
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Conversion Rate</div>
                    <div
                      className={`text-lg font-bold ${
                        source.conversionRate >= 45
                          ? "text-green-600"
                          : source.conversionRate >= 35
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {source.conversionRate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500">Revenue</div>
                    <div className="text-lg font-bold text-green-600">
                      ₹{(source.revenue / 100000).toFixed(1)}L
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500">Avg Deal Value</div>
                    <div className="text-lg font-bold text-gray-900">
                      ₹{(source.avgDealValue / 1000).toFixed(1)}K
                    </div>
                  </div>

                  <div className="w-48">
                    <div className="text-xs text-gray-500 mb-1">
                      Share of Total Leads
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (source.totalLeads / overallMetrics.totalLeads) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {((source.totalLeads / overallMetrics.totalLeads) * 100).toFixed(
                        1
                      )}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversion Funnel */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Conversion Funnel Analysis
        </h2>
        <div className="space-y-3">
          {analytics.conversionFunnel.map((stage, index) => (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="text-sm font-semibold text-gray-900">
                    {stage.stage}
                  </div>
                  <Badge variant="outline">{stage.count} leads</Badge>
                  {stage.dropOff > 0 && (
                    <Badge className="bg-red-100 text-red-700 border-red-300">
                      -{stage.dropOff} drop-off
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {stage.percentage.toFixed(1)}%
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div
                  className={`h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                    index === 0
                      ? "bg-blue-600"
                      : index === 1
                      ? "bg-purple-600"
                      : index === 2
                      ? "bg-indigo-600"
                      : "bg-green-600"
                  }`}
                  style={{ width: `${stage.percentage}%` }}
                >
                  {stage.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* TSE Revenue Ranking */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          TSE Revenue Ranking (MTD)
        </h2>
        <div className="space-y-3">
          {analytics.tseRevenueRanking.map((tse) => (
            <div
              key={tse.tseId}
              className={`p-4 rounded-lg border ${
                tse.rank === 1
                  ? "bg-amber-50 border-amber-300"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      tse.rank === 1
                        ? "bg-amber-200 text-amber-700"
                        : tse.rank === 2
                        ? "bg-gray-300 text-gray-700"
                        : tse.rank === 3
                        ? "bg-orange-200 text-orange-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {tse.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{tse.tseName}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {tse.tseId} • {tse.conversions} conversions
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Revenue</div>
                    <div className="text-xl font-bold text-green-600">
                      ₹{(tse.revenue / 100000).toFixed(2)}L
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500">Avg Deal Value</div>
                    <div className="text-lg font-bold text-gray-900">
                      ₹{(tse.avgDealValue / 1000).toFixed(1)}K
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500">Conversion Rate</div>
                    <div
                      className={`text-lg font-bold ${
                        tse.conversionRate >= 45
                          ? "text-green-600"
                          : tse.conversionRate >= 35
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {tse.conversionRate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="w-48">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(tse.revenue / overallMetrics.totalRevenue) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {((tse.revenue / overallMetrics.totalRevenue) * 100).toFixed(1)}%
                      of total
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bundle Trends */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Bundle Mix & Revenue Trends
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {analytics.bundleTrends.map((bundle) => (
            <div
              key={bundle.dealType}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="mb-3">
                <Badge
                  className={
                    bundle.dealType === "BASE"
                      ? "bg-blue-600"
                      : bundle.dealType === "ADD_ON"
                      ? "bg-green-600"
                      : bundle.dealType === "BUNDLE_MID"
                      ? "bg-purple-600"
                      : "bg-red-600"
                  }
                >
                  {bundle.dealType.replace("_", " ")}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500">Deal Count</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {bundle.count}
                  </div>
                  <div className="text-xs text-gray-600">
                    {bundle.percentage.toFixed(1)}% of total
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Revenue</div>
                  <div className="text-lg font-bold text-green-600">
                    ₹{(bundle.revenue / 100000).toFixed(1)}L
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Avg EBITDA</div>
                  <div
                    className={`text-lg font-bold ${
                      bundle.avgEBITDA >= EBITDA_THRESHOLDS.FLOOR
                        ? "text-green-600"
                        : bundle.avgEBITDA >= (EBITDA_THRESHOLDS.FLOOR - 10) // G17 FIX
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {bundle.avgEBITDA.toFixed(1)}%
                  </div>
                  {bundle.avgEBITDA < 20 && (
                    <div className="text-xs text-red-600 font-medium mt-1">
                      Below target
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CRM Compliance by TSE */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          CRM Compliance by TSE
        </h2>
        <div className="space-y-3">
          {analytics.crmComplianceByTSE.map((tse) => (
            <div
              key={tse.tseId}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{tse.tseName}</div>
                    <div className="text-xs text-gray-600">{tse.tseId}</div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Compliance Score</div>
                    <div className={`text-2xl font-bold ${getStatusColor(tse.status)}`}>
                      {tse.score}%
                    </div>
                  </div>

                  <div>
                    <Badge
                      className={
                        tse.status === "GREEN"
                          ? "bg-green-600"
                          : tse.status === "AMBER"
                          ? "bg-amber-600"
                          : "bg-red-600"
                      }
                    >
                      {tse.status === "GREEN" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {tse.status !== "GREEN" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {tse.status}
                    </Badge>
                  </div>

                  <div className="w-64">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          tse.status === "GREEN"
                            ? "bg-green-600"
                            : tse.status === "AMBER"
                            ? "bg-amber-600"
                            : "bg-red-600"
                        }`}
                        style={{ width: `${tse.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Renewal Rate by TSE */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Renewal Performance by TSE
        </h2>
        <div className="space-y-3">
          {analytics.renewalRateByTSE.map((tse) => (
            <div
              key={tse.tseId}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{tse.tseName}</div>
                    <div className="text-xs text-gray-600">
                      {tse.tseId} • {tse.renewalsCount} renewals
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Renewal Rate</div>
                    <div
                      className={`text-2xl font-bold ${
                        tse.renewalRate >= 70
                          ? "text-green-600"
                          : tse.renewalRate >= 60
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {tse.renewalRate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="w-64">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          tse.renewalRate >= 70
                            ? "bg-green-600"
                            : tse.renewalRate >= 60
                            ? "bg-amber-600"
                            : "bg-red-600"
                        }`}
                        style={{ width: `${Math.min(tse.renewalRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
