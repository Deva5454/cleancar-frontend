/**
 * OPERATIONS MANAGER: DAY CLOSE MODE (7:00 PM+)
 * EOD summary, final review, and day closure workflow
 */

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle, AlertTriangle, DollarSign, Target, Users, Lock, TrendingUp } from "lucide-react";

export interface DayCloseSummary {
  date: Date;
  units: {
    total: number;
    fourW: number;
    twoW: number;
    addOn: number;
    target: number;
  };
  revenue: {
    total: number;
    target: number;
  };
  attendance: {
    present: number;
    expected: number;
  };
  escalations: {
    resolved: number;
    pending: number;
  };
  incentives: {
    totalAccrued: number;
    washersEligible: number;
  };
  issues: {
    complaints: number;
    qualityIssues: number;
  };
}

export interface OMDayCloseModeProps {
  summary: DayCloseSummary;
  isLocked: boolean;
  onSubmitDayClose: (notes: string) => void;
}

export function OMDayCloseMode({ summary, isLocked, onSubmitDayClose }: OMDayCloseModeProps) {
  const handleSubmit = () => {
    const notes = prompt("Day close notes (optional):");
    onSubmitDayClose(notes || "");
  };

  const unitsPercentage = (summary.units.total / summary.units.target) * 100;
  const revenuePercentage = (summary.revenue.total / summary.revenue.target) * 100;
  const attendancePercentage = (summary.attendance.present / summary.attendance.expected) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold">End of Day Summary</h1>
              <p className="text-sm text-slate-300">
                {summary.date.toLocaleDateString("en-IN", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </p>
            </div>
            {isLocked && (
              <div className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg">
                <Lock className="h-5 w-5" />
                <span className="text-sm font-semibold">Payroll Locked</span>
              </div>
            )}
          </div>

          {!isLocked && (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-300" />
              <span className="text-sm text-yellow-100">
                <strong>Reminder:</strong> Payroll locks at midnight. Submit day close before 11:59 PM.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* KEY METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Units Performance */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-300">Total Units</p>
                  <p className="text-3xl font-bold">{summary.units.total}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Target</span>
                  <span className="font-semibold">{summary.units.target}</span>
                </div>
                <div className="bg-white/20 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      unitsPercentage >= 90 ? "bg-green-500" : unitsPercentage >= 75 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, unitsPercentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Achievement</span>
                  <span className={`font-bold ${
                    unitsPercentage >= 90 ? "text-green-400" : unitsPercentage >= 75 ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {unitsPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Performance */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-300">Total Revenue</p>
                  <p className="text-3xl font-bold">₹{(summary.revenue.total / 1000).toFixed(0)}k</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Target</span>
                  <span className="font-semibold">₹{(summary.revenue.target / 1000).toFixed(0)}k</span>
                </div>
                <div className="bg-white/20 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      revenuePercentage >= 90 ? "bg-green-500" : revenuePercentage >= 75 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, revenuePercentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Achievement</span>
                  <span className={`font-bold ${
                    revenuePercentage >= 90 ? "text-green-400" : revenuePercentage >= 75 ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {revenuePercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CATEGORY BREAKDOWN */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-4">Unit Category Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <p className="text-sm text-slate-300 mb-1">4W Vehicles</p>
                <p className="text-3xl font-bold">{summary.units.fourW}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {((summary.units.fourW / summary.units.total) * 100).toFixed(0)}% of total
                </p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                <p className="text-sm text-slate-300 mb-1">2W Vehicles</p>
                <p className="text-3xl font-bold">{summary.units.twoW}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {((summary.units.twoW / summary.units.total) * 100).toFixed(0)}% of total
                </p>
              </div>
              <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <p className="text-sm text-slate-300 mb-1">Add-ons</p>
                <p className="text-3xl font-bold">{summary.units.addOn}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {((summary.units.addOn / summary.units.total) * 100).toFixed(0)}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OPERATIONAL SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-blue-400" />
                <p className="text-sm text-slate-300">Attendance</p>
              </div>
              <p className="text-2xl font-bold mb-1">
                {summary.attendance.present} / {summary.attendance.expected}
              </p>
              <Badge className={`${
                attendancePercentage >= 90 ? "bg-green-600" : "bg-yellow-600"
              } text-white text-xs`}>
                {attendancePercentage.toFixed(0)}%
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-sm text-slate-300">Escalations</p>
              </div>
              <p className="text-2xl font-bold mb-1">
                {summary.escalations.resolved} / {summary.escalations.resolved + summary.escalations.pending}
              </p>
              <Badge className={`${
                summary.escalations.pending === 0 ? "bg-green-600" : "bg-red-600"
              } text-white text-xs`}>
                {summary.escalations.pending} pending
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <p className="text-sm text-slate-300">Incentives</p>
              </div>
              <p className="text-2xl font-bold mb-1">
                ₹{(summary.incentives.totalAccrued / 1000).toFixed(0)}k
              </p>
              <Badge className="bg-purple-600 text-white text-xs">
                {summary.incentives.washersEligible} washers
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* ISSUES & ALERTS */}
        {(summary.issues.complaints > 0 || summary.issues.qualityIssues > 0 || summary.escalations.pending > 0) && (
          <Card className="bg-red-500/10 border-2 border-red-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <h2 className="text-lg font-bold text-white">Pending Issues</h2>
              </div>
              <div className="space-y-2">
                {summary.escalations.pending > 0 && (
                  <div className="flex items-center justify-between text-white">
                    <span className="text-sm">Unresolved Escalations</span>
                    <Badge className="bg-red-600 text-white">{summary.escalations.pending}</Badge>
                  </div>
                )}
                {summary.issues.complaints > 0 && (
                  <div className="flex items-center justify-between text-white">
                    <span className="text-sm">Customer Complaints</span>
                    <Badge className="bg-red-600 text-white">{summary.issues.complaints}</Badge>
                  </div>
                )}
                {summary.issues.qualityIssues > 0 && (
                  <div className="flex items-center justify-between text-white">
                    <span className="text-sm">Quality Issues</span>
                    <Badge className="bg-red-600 text-white">{summary.issues.qualityIssues}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SUBMIT DAY CLOSE */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Ready to Close Day?</h2>
                <p className="text-sm text-blue-100">
                  This will finalize today's operations and prepare payroll processing.
                </p>
                {!isLocked && (
                  <p className="text-xs text-yellow-300 mt-2 flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    Payroll locks at midnight. Time remaining: {/* Calculate remaining time */}
                  </p>
                )}
              </div>
              <div>
                {isLocked ? (
                  <Badge className="bg-white text-blue-900 px-6 py-3 text-lg">
                    ✓ Day Closed
                  </Badge>
                ) : (
                  <Button
                    size="lg"
                    className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8"
                    onClick={handleSubmit}
                    disabled={summary.escalations.pending > 0}
                  >
                    Submit Day Close
                  </Button>
                )}
              </div>
            </div>

            {summary.escalations.pending > 0 && !isLocked && (
              <div className="mt-4 p-3 bg-red-600 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">
                  Cannot close day with {summary.escalations.pending} pending escalation(s). Please resolve all issues first.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
