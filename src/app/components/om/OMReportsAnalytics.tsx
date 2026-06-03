/**
 * 7️⃣ OPERATIONS MANAGER: REPORTS & ANALYTICS
 * Performance intelligence with export capabilities
 */

import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Download, Share2, FileText, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import type { AnalyticsReport } from "../../services/operationsManagerService";

export interface OMReportsAnalyticsProps {
  report: AnalyticsReport;
  onDownload: (reportType: string) => void;
  onShare: (reportType: string) => void;
  onExportCSV: (reportType: string) => void;
}

export function OMReportsAnalytics({
  report,
  onDownload,
  onShare,
  onExportCSV,
}: OMReportsAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "IMPROVING": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "DECLINING": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Reports & Analytics</h1>
              <p className="text-sm text-blue-200">Performance Intelligence</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => onDownload("full-report")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => onShare("full-report")}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => onExportCSV("full-report")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* PERIOD SELECTOR */}
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700 mr-2">Period:</span>
          {["DAILY", "WEEKLY", "MONTHLY"].map((period) => (
            <Button
              key={period}
              size="sm"
              variant={selectedPeriod === period ? "default" : "outline"}
              onClick={() => setSelectedPeriod(period as any)}
            >
              {period}
            </Button>
          ))}
        </div>

        {/* UNITS PER WASHER */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Units Per Washer</h2>
              <Button size="sm" variant="outline" onClick={() => onExportCSV("units-per-washer")}>
                Export
              </Button>
            </div>
            <div className="space-y-2">
              {report.unitsPerWasher.slice(0, 10).map((washer) => (
                <div key={washer.washerName} className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="w-32 text-sm font-semibold text-gray-700">{washer.washerName}</div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-6 relative">
                      <div
                        className={`h-6 rounded-full ${
                          washer.units >= washer.target ? "bg-green-500" : "bg-yellow-500"
                        }`}
                        style={{ width: `${(washer.units / washer.target) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <span className="text-sm font-bold text-gray-900">{washer.units.toFixed(1)}</span>
                    <span className="text-xs text-gray-500"> / {washer.target}</span>
                  </div>
                  <div className="w-24 text-right">
                    <Badge
                      variant="outline"
                      className={washer.variance >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                    >
                      {washer.variance >= 0 ? "+" : ""}{washer.variance.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* WASH TIME ANALYSIS */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Wash Time Analysis</h2>
                {getTrendIcon(report.washTimeAnalysis.trend)}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Time</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {report.washTimeAnalysis.avgTime.toFixed(1)} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Target</span>
                  <span className="text-lg font-semibold text-gray-700">
                    {report.washTimeAnalysis.target} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Variance</span>
                  <Badge
                    variant="outline"
                    className={
                      report.washTimeAnalysis.variance <= 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {report.washTimeAnalysis.variance >= 0 ? "+" : ""}
                    {report.washTimeAnalysis.variance.toFixed(1)} min
                  </Badge>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-700">Trend:</span>
                    <Badge
                      className={
                        report.washTimeAnalysis.trend === "IMPROVING"
                          ? "bg-green-600 text-white"
                          : report.washTimeAnalysis.trend === "DECLINING"
                          ? "bg-red-600 text-white"
                          : "bg-gray-600 text-white"
                      }
                    >
                      {report.washTimeAnalysis.trend}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Cover Distribution</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fairness Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          report.coverDistribution.fairnessScore >= 80 ? "bg-green-500" : "bg-yellow-500"
                        }`}
                        style={{ width: `${report.coverDistribution.fairnessScore}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {report.coverDistribution.fairnessScore}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Max Cover Assigned</span>
                  <span className="text-lg font-bold text-gray-900">
                    {report.coverDistribution.maxCoverAssigned} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Per Washer</span>
                  <span className="text-lg font-bold text-gray-900">
                    {report.coverDistribution.avgCoverPerWasher.toFixed(1)} units
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ATTENDANCE TRENDS */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Attendance Trends</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Late Check-Ins</p>
                <p className="text-3xl font-bold text-red-900">{report.attendanceTrends.lateCheckIns}</p>
                <p className="text-xs text-gray-500 mt-1">This period</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Avg Late By</p>
                <p className="text-3xl font-bold text-orange-900">{report.attendanceTrends.avgLateBy} min</p>
                <p className="text-xs text-gray-500 mt-1">Average delay</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Repeat Offenders</p>
                <p className="text-3xl font-bold text-yellow-900">{report.attendanceTrends.repeatOffenders.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {report.attendanceTrends.repeatOffenders.join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* REVENUE TRENDS */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Revenue Trends</h2>
              <Badge className="bg-green-600 text-white">
                <TrendingUp className="h-4 w-4 mr-1" />
                +{report.revenueTrends.growth.toFixed(1)}% Growth
              </Badge>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Daily Revenue (Last 7 Days)</h3>
                <div className="flex items-end gap-2 h-32">
                  {report.revenueTrends.daily.map((revenue, index) => (
                    <div key={index} className="flex-1 flex flex-col justify-end">
                      <div
                        className="bg-blue-500 rounded-t"
                        style={{
                          height: `${(revenue / Math.max(...report.revenueTrends.daily)) * 100}%`,
                        }}
                      />
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        ₹{(revenue / 1000).toFixed(0)}k
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Weekly Revenue (Last 4 Weeks)</h3>
                <div className="flex items-end gap-2 h-32">
                  {report.revenueTrends.weekly.map((revenue, index) => (
                    <div key={index} className="flex-1 flex flex-col justify-end">
                      <div
                        className="bg-green-500 rounded-t"
                        style={{
                          height: `${(revenue / Math.max(...report.revenueTrends.weekly)) * 100}%`,
                        }}
                      />
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        ₹{(revenue / 100000).toFixed(1)}L
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LOST REASONS ANALYSIS */}
        {report.lostReasons && report.lostReasons.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Lost Reasons Distribution</h2>
                <Button size="sm" variant="outline" onClick={() => onExportCSV("lost-reasons")}>
                  Export
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Chart */}
                <div>
                  <div className="space-y-3">
                    {report.lostReasons.map((item, index) => {
                      const colors = [
                        "bg-red-500",
                        "bg-orange-500",
                        "bg-yellow-500",
                        "bg-purple-500",
                        "bg-gray-500"
                      ];
                      return (
                        <div key={item.reason}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded ${colors[index % colors.length]}`} />
                              <span className="text-sm font-medium text-gray-700">{item.reason}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{item.count}</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full ${colors[index % colors.length]}`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Total Lost Leads</p>
                    <p className="text-3xl font-bold text-red-900">
                      {report.lostReasons.reduce((sum, item) => sum + item.count, 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Top Reason</p>
                    <p className="text-xl font-bold text-orange-900">
                      {report.lostReasons[0]?.reason || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {report.lostReasons[0]?.percentage.toFixed(1)}% of losses
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Action Required</p>
                    <p className="text-sm text-blue-900 font-medium">
                      {report.lostReasons[0]?.reason === "Price"
                        ? "Review pricing strategy"
                        : report.lostReasons[0]?.reason === "Competitor"
                        ? "Competitive analysis needed"
                        : "Follow up on leads"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
