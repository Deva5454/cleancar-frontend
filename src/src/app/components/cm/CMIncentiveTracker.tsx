/**
 * CM INCENTIVE TRACKER
 * Real-time earnings + performance impact visibility
 * 
 * Philosophy: Fully system-calculated, no manual overrides
 * Shows CM exactly how their decisions impact earnings
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Users,
  Target,
  Award,
  Calendar,
} from "lucide-react";
import type { CMIncentiveTracker } from "../../types/clusterManager.types";
import { INCENTIVE_STATUS_CONFIG } from "../../constants/clusterManager.constants";
import { formatCurrency } from "../../lib/formatters";

interface CMIncentiveTrackerProps {
  incentiveData: CMIncentiveTracker;
}

export function CMIncentiveTracker({ incentiveData }: CMIncentiveTrackerProps) {

  const getStatusIcon = (status: string) => {
    if (status === "FULL_PAYOUT") return CheckCircle2;
    if (status === "PARTIAL_PAYOUT") return AlertCircle;
    return XCircle;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "UP") return TrendingUp;
    if (trend === "DOWN") return TrendingDown;
    return Minus;
  };

  return (
    <div className="space-y-6">
      {/* Header with Month */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Incentive Tracker</h2>
          <p className="text-sm text-slate-600 mt-1">
            Real-time earnings calculation based on cluster performance
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-600">Current Month</div>
          <div className="text-lg font-semibold text-slate-900">{incentiveData.month}</div>
          <div className="text-xs text-slate-500 mt-1">
            Last updated: {incentiveData.auditLog.lastRecalculated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Current Earnings Summary */}
      <Card className="p-6 border-2 border-blue-600 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-slate-600">Projected Monthly Incentive</div>
            <div className="text-4xl font-bold text-blue-600">
              {formatCurrency(incentiveData.currentEarnings.totalProjected)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-200">
          <div>
            <div className="text-xs text-slate-600 mb-1">Base Incentive</div>
            <div className="text-lg font-semibold text-slate-900">
              {formatCurrency(incentiveData.currentEarnings.baseIncentive)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 mb-1">KPI Bonus</div>
            <div className="text-lg font-semibold text-green-600">
              +{formatCurrency(incentiveData.currentEarnings.kpiBonus)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 mb-1">Team Multiplier</div>
            <div className={`text-lg font-semibold ${
              incentiveData.currentEarnings.teamMultiplier > 0 ? "text-green-600" : "text-slate-400"
            }`}>
              {incentiveData.currentEarnings.teamMultiplier > 0 ? "+" : ""}
              {formatCurrency(incentiveData.currentEarnings.teamMultiplier)}
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Breakdown with Weightage */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          KPI Score Breakdown (Weightage-Based Payout)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {Object.values(incentiveData.kpis).map((kpi) => {
            const statusConfig = INCENTIVE_STATUS_CONFIG[kpi.status];
            const StatusIcon = getStatusIcon(kpi.status);

            return (
              <Card
                key={kpi.name}
                className={`p-4 border-2 ${statusConfig.borderColor} ${statusConfig.bgLight}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{kpi.name}</h4>
                      <Badge className={`${statusConfig.color} text-white text-xs`}>
                        {kpi.weightage}%
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {kpi.current.toFixed(1)}%
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg ${statusConfig.bgLight}`}>
                    <StatusIcon className={`w-6 h-6 ${statusConfig.textColor}`} />
                  </div>
                </div>

                <Progress value={kpi.current} className="mb-2" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Target: {kpi.target}%</span>
                  <Badge variant="outline" className={statusConfig.borderColor}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="text-xs text-slate-600">Payout Multiplier</div>
                  <div className={`text-lg font-bold ${
                    kpi.payoutMultiplier === 1.0 ? "text-green-600" :
                    kpi.payoutMultiplier === 0.5 ? "text-amber-600" :
                    "text-red-600"
                  }`}>
                    {(kpi.payoutMultiplier * 100).toFixed(0)}%
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Team Multiplier Tracker */}
      <Card className={`p-5 border-2 ${
        incentiveData.teamMultiplierStatus.eligible
          ? "border-green-600 bg-green-50"
          : "border-amber-600 bg-amber-50"
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg ${
            incentiveData.teamMultiplierStatus.eligible ? "bg-green-600" : "bg-amber-600"
          }`}>
            <Award className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">Team Multiplier Bonus (20%)</h3>
            <p className="text-sm text-slate-600">
              {incentiveData.teamMultiplierStatus.eligible
                ? "✅ ON TRACK - All conditions met"
                : "⚠️ NOT ON TRACK - Requirements not met"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Multiplier</div>
            <div className={`text-2xl font-bold ${
              incentiveData.teamMultiplierStatus.eligible ? "text-green-600" : "text-slate-400"
            }`}>
              {incentiveData.teamMultiplierStatus.multiplierValue.toFixed(1)}x
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Condition 1 */}
          <div className={`p-3 rounded-lg ${
            incentiveData.teamMultiplierStatus.condition1.met ? "bg-green-100" : "bg-red-100"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {incentiveData.teamMultiplierStatus.condition1.met ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-semibold text-slate-900">
                {incentiveData.teamMultiplierStatus.condition1.label}
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {incentiveData.teamMultiplierStatus.condition1.current}% / {incentiveData.teamMultiplierStatus.condition1.target}%
            </div>
          </div>

          {/* Condition 2 */}
          <div className={`p-3 rounded-lg ${
            incentiveData.teamMultiplierStatus.condition2.met ? "bg-green-100" : "bg-red-100"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {incentiveData.teamMultiplierStatus.condition2.met ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-semibold text-slate-900">
                {incentiveData.teamMultiplierStatus.condition2.label}
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {incentiveData.teamMultiplierStatus.condition2.current}% / {incentiveData.teamMultiplierStatus.condition2.target}%
            </div>
          </div>
        </div>
      </Card>

      {/* Revenue Breakdown & OM Ranking */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Cluster Revenue */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Cluster Revenue Performance</h3>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-3xl font-bold text-slate-900">
                {formatCurrency(incentiveData.revenueBreakdown.clusterTotal)}
              </div>
              <div className="text-sm text-slate-600">
                / {formatCurrency(incentiveData.revenueBreakdown.clusterTarget)}
              </div>
            </div>
            <Progress value={incentiveData.revenueBreakdown.percentage} className="mb-2" />
            <div className="text-sm text-slate-600">
              {incentiveData.revenueBreakdown.percentage.toFixed(1)}% of target achieved
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="text-sm font-semibold text-slate-700 mb-2">OM Revenue Ranking</div>
            <div className="space-y-2">
              {incentiveData.revenueBreakdown.omRanking.slice(0, 6).map((om) => (
                <div key={om.omName} className="flex items-center gap-2">
                  <Badge variant="outline" className="w-8 text-center">
                    #{om.rank}
                  </Badge>
                  <div className="flex-1 text-sm text-slate-900">{om.omName}</div>
                  <div className={`text-sm font-semibold ${
                    om.percentage >= 95 ? "text-green-600" :
                    om.percentage >= 80 ? "text-amber-600" :
                    "text-red-600"
                  }`}>
                    {om.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Historical & Projections */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Historical & Projections</h3>
          </div>

          {/* Last Month Comparison */}
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-600 mb-1">Last Month Payout</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(incentiveData.historicalReference.lastMonthPayout)}
              </div>
              <Badge className={`gap-1 ${
                incentiveData.historicalReference.trend === "UP" ? "bg-green-600" :
                incentiveData.historicalReference.trend === "DOWN" ? "bg-red-600" :
                "bg-slate-600"
              } text-white`}>
                {incentiveData.historicalReference.trend === "UP" && (
                  <TrendingUp className="w-3 h-3" />
                )}
                {incentiveData.historicalReference.trend === "DOWN" && (
                  <TrendingDown className="w-3 h-3" />
                )}
                {incentiveData.historicalReference.percentageChange > 0 ? "+" : ""}
                {incentiveData.historicalReference.percentageChange.toFixed(1)}%
              </Badge>
            </div>
          </div>

          {/* Payout Scenarios */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-700 mb-2">Payout Scenarios</div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-green-700 font-semibold">OPTIMISTIC</div>
                  <div className="text-sm text-green-600">All targets met + multiplier</div>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(incentiveData.projectedPayout.optimistic)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-700 font-semibold">REALISTIC</div>
                  <div className="text-sm text-blue-600">Current trajectory maintained</div>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(incentiveData.projectedPayout.realistic)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-amber-700 font-semibold">PESSIMISTIC</div>
                  <div className="text-sm text-amber-600">Performance declines</div>
                </div>
                <div className="text-lg font-bold text-amber-600">
                  {formatCurrency(incentiveData.projectedPayout.pessimistic)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* System Notice */}
      <Card className="p-4 bg-slate-50 border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-200 rounded">
            <Award className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              System-Calculated Incentive
            </h4>
            <p className="text-xs text-slate-600">
              All incentive calculations are system-generated based on real-time KPI data. 
              No manual overrides allowed. Updates daily at midnight. All actions are auditable 
              and visible to management.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
