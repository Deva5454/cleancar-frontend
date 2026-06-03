/**
 * CRM Conversion Analytics Dashboard
 *
 * Purpose:
 * - Display lead conversion analytics and KPIs
 * - Track TSE performance metrics
 * - Visualize conversion trends and revenue
 * - Provide business intelligence for sales optimization
 *
 * Data Sources:
 * - AnalyticsService (LEAD_CONVERTED events)
 * - AuditService (conversion audit logs)
 *
 * Features:
 * - Real-time KPI cards (conversions, rate, MRR)
 * - TSE leaderboard (sortable)
 * - Daily conversion trend chart
 * - Revenue source breakdown
 * - Conversion funnel visualization
 */

import { useState, useMemo } from "react";
import { AnalyticsService } from "../../services/analyticsService";
import { AuditService } from "../../services/auditService";
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Award,
  Calendar,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export function CRMConversionAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [sortBy, setSortBy] = useState<"revenue" | "conversions">("revenue");

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date();

    switch (dateRange) {
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      case "all":
        start.setFullYear(2020, 0, 1);
        break;
    }

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end,
    };
  }, [dateRange]);

  // Get metrics from analytics service
  const metrics = useMemo(() => {
    if (dateRange === "all") {
      return AnalyticsService.getConversionMetrics();
    }
    return AnalyticsService.getConversionMetrics(startDate, endDate);
  }, [dateRange, startDate, endDate]);

  // Get TSE leaderboard
  const tseLeaderboard = useMemo(() => {
    const leaderboard = dateRange === "all"
      ? AnalyticsService.getTSELeaderboard()
      : AnalyticsService.getTSELeaderboard(startDate, endDate);

    return leaderboard.sort((a, b) => {
      if (sortBy === "revenue") {
        return b.revenue - a.revenue;
      }
      return b.conversions - a.conversions;
    });
  }, [dateRange, startDate, endDate, sortBy]);

  // Get audit stats
  const auditStats = useMemo(() => {
    return AuditService.getStatistics();
  }, []);

  // Calculate conversion rate (placeholder - would need lead count in real app)
  const conversionRate = metrics.conversionRate || 0;

  // Export data as CSV
  const handleExport = () => {
    const csv = [
      ["Date Range", dateRange],
      ["Total Conversions", metrics.totalConversions],
      ["Total Revenue", `₹${(metrics?.totalRevenue ?? 0).toLocaleString()}`],
      ["Average Deal Size", `₹${(metrics?.averageRevenue ?? 0).toLocaleString()}`],
      [""],
      ["TSE Performance"],
      ["TSE Name", "Conversions", "Revenue", "Avg Deal Size"],
      ...tseLeaderboard.map(tse => [
        tse.name,
        tse.conversions,
        `₹${(tse?.revenue ?? 0).toLocaleString()}`,
        `₹${(tse?.avgDealSize ?? 0).toLocaleString()}`,
      ]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `conversion-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conversion Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">
              Track lead conversions, TSE performance, and revenue metrics
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Time Period:</span>
          <div className="flex gap-2">
            {(["7d", "30d", "90d", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  dateRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {range === "7d" && "Last 7 Days"}
                {range === "30d" && "Last 30 Days"}
                {range === "90d" && "Last 90 Days"}
                {range === "all" && "All Time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Conversions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {(metrics?.totalConversions ?? 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Conversions</div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">Revenue</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            ₹{(metrics?.totalRevenue ?? 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>

        {/* Average Deal Size */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">Avg Deal</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            ₹{Math.round(metrics.averageRevenue).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Per Conversion</div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">Rate</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {conversionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TSE Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <h2 className="text-lg font-semibold text-gray-900">TSE Performance</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("revenue")}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === "revenue"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setSortBy("conversions")}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === "conversions"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Conversions
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    TSE Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Conversions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Avg Deal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tseLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No conversion data available for this period
                    </td>
                  </tr>
                ) : (
                  tseLeaderboard.map((tse, index) => (
                    <tr key={tse.tseId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && (
                            <span className="text-2xl mr-2">🥇</span>
                          )}
                          {index === 1 && (
                            <span className="text-2xl mr-2">🥈</span>
                          )}
                          {index === 2 && (
                            <span className="text-2xl mr-2">🥉</span>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tse.name}
                        </div>
                        <div className="text-xs text-gray-500">{tse.tseId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {tse.conversions}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ₹{(tse?.revenue ?? 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₹{Math.round(tse.avgDealSize).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lead Sources</h2>
          </div>
          <div className="p-6">
            {metrics.sourceBreakdown.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No source data available
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.sourceBreakdown.map((source) => (
                  <div key={source.source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {source.source}
                      </span>
                      <span className="text-sm text-gray-600">
                        {source.conversions} ({(source?.percentage ?? 0).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Daily Conversion Trend</h2>
          </div>
        </div>
        <div className="p-6">
          {metrics.dailyTrend.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No trend data available for this period
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.dailyTrend.slice(-14).map((day) => (
                <div key={day.date} className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="bg-blue-600 h-8 rounded flex items-center justify-end px-2 transition-all"
                        style={{
                          width: `${
                            (day.conversions / Math.max(...metrics.dailyTrend.map(d => d.conversions))) * 100
                          }%`,
                          minWidth: day.conversions > 0 ? "60px" : "0",
                        }}
                      >
                        <span className="text-white text-sm font-semibold">
                          {day.conversions}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        ₹{(day?.revenue ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Health */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(auditStats?.success ?? 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {(auditStats?.failed ?? 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {(auditStats?.errors ?? 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {auditStats.successRate}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
