import { BackButton } from "../ui/back-button";
/**
 * Incentive Forecast Dashboard
 *
 * Displays forecast metrics, earnings projections, gap indicators,
 * risk alerts, and performance trends
 *
 * @component
 */

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  TrendingUpIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useLiveKPI } from "../../hooks/useLiveKPI";

export function IncentiveDashboard() {
  const kpi = useLiveKPI();
  // Live KPI values (replaces MASTER_KPI_DATA)
  const revenue = kpi.monthlyRevenue;
  const conversionRate = kpi.conversionRate;
  const retentionRate = kpi.totalCustomers > 0
    ? (kpi.activeSubscriptions / kpi.totalCustomers) * 100
    : 0;
  const ebitda = (kpi.monthlyRevenue * kpi.ebitdaMargin) / 100;
  const ebitdaMargin = kpi.ebitdaMargin;

  // TODO: Replace with actual incentive data from backend
  const currentDate = new Date("2026-04-19");
  const currentDay = currentDate.getDate();
  const daysInMonth = 30;
  const daysRemaining = daysInMonth - currentDay;

  // Mock earnings data - should come from backend
  const earnedTillDate = 285000; // ₹2.85L
  const projectedEarnings = 625000; // ₹6.25L
  const maxPotential = 875000; // ₹8.75L (if all employees hit 120% target)

  const progressPercent = (earnedTillDate / projectedEarnings) * 100;
  const potentialGap = maxPotential - projectedEarnings;

  // Next milestone calculation
  const nextMilestone = 350000;
  const gapToNextLevel = nextMilestone - earnedTillDate;
  const milestoneProgress = (earnedTillDate / nextMilestone) * 100;

  // Risk alerts - should be derived from backend
  const riskAlerts = [
    {
      id: 1,
      type: "warning" as const,
      message: "12 employees are below 80% quota achievement",
      count: 12,
      severity: "medium",
    },
    {
      id: 2,
      type: "success" as const,
      message: "Budget utilization on track - 68% used with 63% month elapsed",
      severity: "low",
    },
    {
      id: 3,
      type: "error" as const,
      message: "3 employees at risk of missing minimum payout threshold",
      count: 3,
      severity: "high",
    },
  ];

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Incentive Forecast Dashboard</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-sm">
              <p className="text-sm font-semibold mb-2">About This Dashboard</p>
              <p className="text-xs text-gray-300">
                Displays real-time incentive performance metrics, earnings projections,
                and risk indicators based on current KPI data and configured rules.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Section 1: KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
          <CardContent className="p-3 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-sm font-medium text-blue-700">Monthly Revenue</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-blue-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Total revenue from all active subscriptions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-blue-900">
                  ₹{(revenue / 100000).toFixed(2)}L
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 animate-pulse" />
                  <span className="text-sm text-green-600 font-semibold">
                    +{10}% vs last month
                  </span>
                </div>
              </div>
              <DollarSign className="w-12 h-12 text-blue-600 opacity-20 transition-opacity duration-200 group-hover:opacity-30" />
            </div>
          </CardContent>
        </Card>

        {/* Conversion */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
          <CardContent className="p-3 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-sm font-medium text-purple-700">Conversion Rate</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-purple-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Percentage of leads converted to customers</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-purple-900">{conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-purple-600 font-medium mt-2">
                  {Math.round(kpi.conversionRate * kpi.totalCustomers / 100)} / {kpi.totalCustomers} leads
                </p>
              </div>
              <Target className="w-12 h-12 text-purple-600 opacity-20 transition-all duration-200" />
            </div>
          </CardContent>
        </Card>

        {/* Retention */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
          <CardContent className="p-3 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-sm font-medium text-green-700">Retention Rate</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-green-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Active subscriptions ÷ total customers</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-green-900">{retentionRate.toFixed(1)}%</p>
                <p className="text-sm text-green-600 font-medium mt-2">
                  {kpi.activeSubscriptions} active subscriptions
                </p>
              </div>
              <Users className="w-12 h-12 text-green-600 opacity-20 transition-all duration-200" />
            </div>
          </CardContent>
        </Card>

        {/* EBITDA */}
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
          <CardContent className="p-3 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-sm font-medium text-orange-700">EBITDA</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-orange-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">Monthly revenue × EBITDA margin ({ebitdaMargin}%)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-3xl font-bold text-orange-900">
                  ₹{(ebitda / 100000).toFixed(2)}L
                </p>
                <p className="text-sm text-orange-600 font-medium mt-2">{ebitdaMargin.toFixed(1)}% margin</p>
              </div>
              <TrendingUpIcon className="w-12 h-12 text-orange-600 opacity-20 transition-all duration-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Earnings Projection */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-900">Earnings Projection - April 2026</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <Info className="w-4 h-4 text-gray-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">
                    Projections based on current pace. Earned = actual payouts till today.
                    Projected = linear forecast to month end. Max = if all employees hit 120% target.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Earned Till Date */}
            <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
              <p className="text-sm font-semibold text-green-700 mb-2">Earned Till Date</p>
              <p className="text-4xl font-bold text-green-900 mb-2 transition-all duration-300">
                ₹{(earnedTillDate / 100000).toFixed(2)}L
              </p>
              <p className="text-xs font-medium text-green-600">
                Day {currentDay} of {daysInMonth}
              </p>
              <div className="mt-3">
                <Progress value={progressPercent} className="h-2 transition-all duration-500" />
                <p className="text-xs text-gray-600 font-medium mt-1.5">{progressPercent.toFixed(1)}% of projected</p>
              </div>
            </div>

            {/* Projected */}
            <div className="text-center p-6 bg-blue-50 rounded-xl border-2 border-blue-200 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
              <p className="text-sm font-semibold text-blue-700 mb-2">Projected (End of Month)</p>
              <p className="text-4xl font-bold text-blue-900 mb-2 transition-all duration-300">
                ₹{(projectedEarnings / 100000).toFixed(2)}L
              </p>
              <p className="text-xs font-medium text-blue-600">Based on current pace</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 animate-pulse" />
                <p className="text-sm text-blue-600 font-semibold">
                  ₹{((projectedEarnings - earnedTillDate) / daysRemaining / 1000).toFixed(0)}K/day needed
                </p>
              </div>
            </div>

            {/* Max Potential */}
            <div className="text-center p-6 bg-purple-50 rounded-xl border-2 border-purple-200 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
              <p className="text-sm font-semibold text-purple-700 mb-2">Max Potential</p>
              <p className="text-4xl font-bold text-purple-900 mb-2 transition-all duration-300">
                ₹{(maxPotential / 100000).toFixed(2)}L
              </p>
              <p className="text-xs font-medium text-purple-600">If all hit 120% target</p>
              <div className="mt-3">
                <Badge variant="outline" className="border-purple-300 text-purple-700 font-semibold transition-all duration-200 hover:bg-purple-100">
                  +₹{(potentialGap / 1000).toFixed(0)}K upside
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 3: Gap Indicator */}
        <Card>
          <CardHeader>
            <CardTitle>Next Milestone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Progress to ₹{(nextMilestone / 100000).toFixed(2)}L</p>
                <p className="text-sm font-medium text-blue-600">{milestoneProgress.toFixed(1)}%</p>
              </div>

              <Progress value={milestoneProgress} className="h-3" />

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      ₹{(gapToNextLevel / 1000).toFixed(0)}K needed to unlock next level
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      At current pace: {Math.ceil(gapToNextLevel / ((projectedEarnings - earnedTillDate) / daysRemaining))} days remaining
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Current</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{(earnedTillDate / 100000).toFixed(1)}L
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-600">Next Level</p>
                  <p className="text-lg font-bold text-blue-900">
                    ₹{(nextMilestone / 100000).toFixed(1)}L
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Max</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{(maxPotential / 100000).toFixed(1)}L
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Risk Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskAlerts.map((alert) => (
                <Alert
                  key={alert.id}
                  variant={alert.type === "error" ? "destructive" : "default"}
                  className={
                    alert.type === "warning"
                      ? "border-yellow-200 bg-yellow-50"
                      : alert.type === "success"
                      ? "border-green-200 bg-green-50"
                      : ""
                  }
                >
                  <div className="flex items-start gap-3">
                    {alert.type === "error" && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                    {alert.type === "warning" && (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    )}
                    {alert.type === "success" && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription
                        className={
                          alert.type === "warning"
                            ? "text-yellow-800"
                            : alert.type === "success"
                            ? "text-green-800"
                            : ""
                        }
                      >
                        {alert.message}
                      </AlertDescription>
                      {alert.count && (
                        <Badge
                          variant="outline"
                          className={`mt-2 ${
                            alert.type === "error"
                              ? "border-red-300 text-red-700"
                              : "border-yellow-300 text-yellow-700"
                          }`}
                        >
                          {alert.count} employees affected
                        </Badge>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-red-600">3</p>
                  <p className="text-xs text-gray-600">Critical</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">12</p>
                  <p className="text-xs text-gray-600">Warnings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">32</p>
                  <p className="text-xs text-gray-600">On Track</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 5: Graph Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Incentive Trend - Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <TrendingUpIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chart placeholder</p>
              <p className="text-xs mt-1">
                Will display: Monthly trend (Line) + Target comparison (Bar)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default IncentiveDashboard;
