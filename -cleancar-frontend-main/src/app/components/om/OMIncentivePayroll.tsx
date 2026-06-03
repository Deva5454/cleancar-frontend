/**
 * OPERATIONS MANAGER: INCENTIVE & PAYROLL DASHBOARD
 * KPI-driven incentive tracking with transparency
 * NON-EDITABLE: System calculated only
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DollarSign, TrendingUp, Eye, Lock, Download, AlertCircle, Info } from "lucide-react";
import { KPI_SCORE_BANDS } from "../../constants/operationsManager.constants";

export interface KPIScore {
  metric: "REVENUE" | "CONVERSION" | "RETENTION" | "OPERATIONS" | "CX";
  weight: number;
  target: number;
  achieved: number;
  achievementPercentage: number;
  scoreApplied: number; // 0, 70, or 100
  contribution: number; // scoreApplied * weight
}

export interface IncentiveTracking {
  washerId: string;
  washerName: string;
  teamName: string;
  kpiScores: KPIScore[];
  totalScore: number;
  incentiveAmount: number;
  teamBonusEligible: boolean;
  teamBonusAmount?: number;
  month: string;
  calculationStatus: "CALCULATING" | "CALCULATED" | "APPLIED";
}

export interface IncentivePayrollProps {
  tracking: IncentiveTracking[];
  onViewBreakdown: (washerId: string) => void;
  onSubmitOverride: (washerId: string) => void;
  onExportPayroll: () => void;
}

export function OMIncentivePayroll({
  tracking,
  onViewBreakdown,
  onSubmitOverride,
  onExportPayroll,
}: IncentivePayrollProps) {
  const getScoreColor = (achievementPercentage: number) => {
    if (achievementPercentage >= KPI_SCORE_BANDS.EXCELLENT.min) return "bg-green-100 text-green-700 border-green-300";
    if (achievementPercentage >= KPI_SCORE_BANDS.GOOD.min) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  const getScoreApplied = (achievementPercentage: number) => {
    if (achievementPercentage >= KPI_SCORE_BANDS.EXCELLENT.min) return KPI_SCORE_BANDS.EXCELLENT.score;
    if (achievementPercentage >= KPI_SCORE_BANDS.GOOD.min) return KPI_SCORE_BANDS.GOOD.score;
    return KPI_SCORE_BANDS.POOR.score;
  };

  const getMetricLabel = (metric: KPIScore["metric"]) => {
    switch (metric) {
      case "REVENUE": return "Revenue";
      case "CONVERSION": return "Conversion";
      case "RETENTION": return "Retention";
      case "OPERATIONS": return "Unit Productivity";
      case "CX": return "Customer Experience";
    }
  };

  // Sample washer for detailed view (first in list)
  const sampleWasher = tracking[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Incentive & Payroll Dashboard</h1>
              <p className="text-sm text-purple-100">System-Calculated • Non-Editable • Transparent</p>
            </div>
            <Button
              size="lg"
              className="bg-white text-purple-700 hover:bg-purple-50 font-bold px-6"
              onClick={onExportPayroll}
            >
              Export Payroll
            </Button>
          </div>

          {/* TIMELINE DISPLAY */}
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-5 w-5" />
                <h3 className="font-bold">Incentive Timeline</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <p className="text-xs text-purple-100 mb-1">KPI Calculation</p>
                  <p className="text-sm font-bold">Month-End Midnight</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <p className="text-xs text-purple-100 mb-1">Incentive Visible</p>
                  <p className="text-sm font-bold">2nd of Next Month</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <p className="text-xs text-purple-100 mb-1">Payroll Applied</p>
                  <p className="text-sm font-bold">5th of Next Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPI SCORE PANEL - DETAILED EXAMPLE */}
        <Card className="border-2 border-purple-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  KPI Score Breakdown - {sampleWasher.washerName}
                </h2>
                <p className="text-sm text-gray-600">{sampleWasher.teamName} • {sampleWasher.month}</p>
              </div>
              <Badge className="bg-purple-600 text-white px-4 py-2 text-lg">
                Total Score: {sampleWasher.totalScore}%
              </Badge>
            </div>

            {/* INCENTIVE CALCULATION FORMULA */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                System Calculated — Non Editable
              </h3>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2 font-semibold">Total Incentive Formula:</p>
                <div className="space-y-1 text-sm">
                  <p>• <strong>Revenue Score</strong> × 40%</p>
                  <p>• <strong>Conversion</strong> × 20%</p>
                  <p>• <strong>Retention</strong> × 20%</p>
                  <p>• <strong>Operations</strong> × 10%</p>
                  <p>• <strong>CX</strong> × 10%</p>
                </div>
              </div>
            </div>

            {/* KPI METRICS BREAKDOWN */}
            <div className="space-y-4">
              {sampleWasher.kpiScores.map((kpi) => {
                const scoreApplied = getScoreApplied(kpi.achievementPercentage);
                
                return (
                  <div key={kpi.metric} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900">{getMetricLabel(kpi.metric)}</h3>
                          <Badge className="bg-gray-700 text-white text-xs">
                            Weight: {kpi.weight}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Target: <strong>{kpi.target}</strong>
                          </span>
                          <span className="text-gray-600">
                            Achieved: <strong>{kpi.achieved}</strong>
                          </span>
                          <Badge className={getScoreColor(kpi.achievementPercentage)} variant="outline">
                            {kpi.achievementPercentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-1">Score Applied</p>
                        <Badge className={`text-xl px-4 py-2 ${
                          scoreApplied === 100 ? "bg-green-600" : 
                          scoreApplied === 70 ? "bg-yellow-600" : 
                          "bg-red-600"
                        } text-white`}>
                          {scoreApplied}%
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-gray-200 rounded-full h-4 mb-2">
                      <div
                        className={`h-4 rounded-full ${
                          kpi.achievementPercentage >= 100 ? "bg-green-600" :
                          kpi.achievementPercentage >= 90 ? "bg-yellow-600" :
                          "bg-red-600"
                        }`}
                        style={{ width: `${Math.min(100, kpi.achievementPercentage)}%` }}
                      />
                    </div>

                    {/* Contribution Calculation */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Contribution: {scoreApplied}% × {kpi.weight}%
                      </span>
                      <span className="font-bold text-purple-700">
                        = {kpi.contribution.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTAL CALCULATION */}
            <div className="mt-6 p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-purple-100 mb-1">Total KPI Score</p>
                  <p className="text-3xl font-bold">{sampleWasher.totalScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-purple-100 mb-1">Base Incentive</p>
                  <p className="text-3xl font-bold">₹{(sampleWasher.incentiveAmount / 1000).toFixed(1)}k</p>
                </div>
              </div>
            </div>

            {/* TEAM MULTIPLIER CALCULATION STRIP */}
            {sampleWasher.teamBonusEligible && (
              <div className="mt-4 p-4 bg-white border-2 border-purple-300 rounded-lg">
                <p className="text-xs font-medium text-purple-700 mb-3 uppercase">Team Multiplier: ×1.2 applied to total</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-600 mb-1">Base Total</p>
                    <p className="text-2xl font-bold text-gray-900">₹{(sampleWasher.incentiveAmount / 1000).toFixed(1)}k</p>
                  </div>

                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="w-8 h-0.5 bg-purple-300"></div>
                    <span className="text-lg font-bold">→</span>
                    <div className="w-8 h-0.5 bg-purple-300"></div>
                  </div>

                  <div className="flex-1 text-center px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-700 mb-1">Multiplier</p>
                    <p className="text-2xl font-bold text-purple-900">×1.2</p>
                  </div>

                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="w-8 h-0.5 bg-purple-300"></div>
                    <span className="text-lg font-bold">→</span>
                    <div className="w-8 h-0.5 bg-purple-300"></div>
                  </div>

                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-600 mb-1">Final Payout</p>
                    <p className="text-2xl font-bold text-green-600">₹{((sampleWasher.teamBonusAmount || 0) / 1000).toFixed(1)}k</p>
                  </div>
                </div>
              </div>
            )}

            {/* TEAM BONUS INDICATOR */}
            <div className="mt-4">
              <Card className={sampleWasher.teamBonusEligible ? "bg-green-50 border-2 border-green-300" : "bg-gray-50 border-2 border-gray-300"}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Team Bonus Status</h3>
                      <p className="text-sm text-gray-600">Conditions: Revenue ≥100% AND Retention ≥80%</p>
                    </div>
                    {sampleWasher.teamBonusEligible ? (
                      <Badge className="bg-green-600 text-white px-4 py-2 text-lg">
                        ✅ Eligible • +20% Bonus Applied
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-400 text-white px-4 py-2">
                        ⏳ Tracking • Condition Not Yet Met
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}