// Day Summary Screen - End of day performance report
// Shows after check-out completion
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  CheckCircle,
  Target,
  DollarSign,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
} from "lucide-react";

export interface PenaltyItem {
  type: string;
  message: string;
  severity: "high" | "medium" | "low";
}

export interface DaySummaryData {
  date: string;
  totalUnits: number;
  baseUnits: number;
  incentiveUnits: number;
  addOnServices: number;
  todayEarnings: number;
  incentiveEarnings: number;
  addOnEarnings: number;
  totalWorkingTime: string;
  checkInTime: string;
  checkOutTime: string;
  attendanceStatus: "Present" | "Late" | "Partial" | "Absent";
  performanceRating: "Excellent" | "Good" | "Average" | "Needs Improvement";
  penalties?: PenaltyItem[];
  bonuses?: string[];
  baseNotAchieved?: boolean;
  lateCheckInPenalty?: boolean;
  unitsOutsideBand?: number;
}

export interface DaySummaryScreenProps {
  summaryData: DaySummaryData;
  onClose: () => void;
}

export function DaySummaryScreen({ summaryData, onClose }: DaySummaryScreenProps) {
  const getAttendanceColor = () => {
    switch (summaryData.attendanceStatus) {
      case "Present":
        return "bg-green-600";
      case "Late":
        return "bg-amber-600";
      case "Partial":
        return "bg-orange-600";
      case "Absent":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getPerformanceColor = () => {
    switch (summaryData.performanceRating) {
      case "Excellent":
        return "text-green-600";
      case "Good":
        return "text-blue-600";
      case "Average":
        return "text-amber-600";
      case "Needs Improvement":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const baseCompleted = (summaryData.baseUnits ?? 0) >= 25;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="text-6xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">Day Complete!</h1>
        <p className="text-sm text-gray-600 mt-1">
          {summaryData.date ? new Date(summaryData.date).toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }) : 'Date not available'}
        </p>
      </div>

      {/* ====== PERFORMANCE OVERVIEW ====== */}
      <Card className="mb-4 border-2 border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Target className="w-5 h-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {/* Total Units */}
            <div className="p-4 bg-white rounded-lg border-2 border-blue-300 text-center">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Total Units</p>
              <p className="text-4xl font-bold text-blue-600">{summaryData.totalUnits ?? 0}</p>
            </div>

            {/* Performance Rating */}
            <div className="p-4 bg-white rounded-lg border-2 border-blue-300 text-center">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Performance</p>
              <p className={`text-lg font-bold ${getPerformanceColor()}`}>
                {summaryData.performanceRating}
              </p>
            </div>
          </div>

          {/* Base vs Incentive Split */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Base</p>
              <p className="text-2xl font-bold text-blue-600">{summaryData.baseUnits ?? 0}</p>
              {!baseCompleted && (
                <p className="text-xs text-red-600 mt-1">⚠️ Below 25</p>
              )}
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Incentive</p>
              <p className="text-2xl font-bold text-green-600">{summaryData.incentiveUnits ?? 0}</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Add-ons</p>
              <p className="text-2xl font-bold text-purple-600">{summaryData.addOnServices ?? 0}</p>
            </div>
          </div>

          {/* Base Not Achieved Warning */}
          {!baseCompleted && (
            <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm text-red-900 text-center font-semibold">
                ⚠️ Base target not achieved — no incentive earned
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== EARNINGS SUMMARY ====== */}
      <Card className="mb-4 border-2 border-green-300 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <DollarSign className="w-5 h-5" />
            Today's Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Total Earnings */}
          <div className="p-5 bg-white rounded-lg border-2 border-green-400 shadow-md text-center mb-4">
            <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Total Earned</p>
            <p className="text-5xl font-bold text-green-600">
              ₹{(summaryData.todayEarnings ?? 0).toLocaleString()}
            </p>
          </div>

          {/* Earnings Breakdown */}
          {((summaryData.incentiveEarnings ?? 0) > 0 || (summaryData.addOnEarnings ?? 0) > 0) && (
            <div className="space-y-2">
              {(summaryData.incentiveEarnings ?? 0) > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Incentive Earnings</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    ₹{(summaryData.incentiveEarnings ?? 0).toLocaleString()}
                  </span>
                </div>
              )}

              {(summaryData.addOnEarnings ?? 0) > 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Add-on Earnings</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    ₹{(summaryData.addOnEarnings ?? 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== TIME SUMMARY ====== */}
      <Card className="mb-4 border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Check-in</span>
              <span className="text-sm font-semibold text-gray-900">{summaryData.checkInTime}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Check-out</span>
              <span className="text-sm font-semibold text-gray-900">{summaryData.checkOutTime}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
              <span className="text-sm font-medium text-blue-900">Total Working Time</span>
              <span className="text-lg font-bold text-blue-600">{summaryData.totalWorkingTime}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ====== ATTENDANCE STATUS ====== */}
      <Card className="mb-4 border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <Badge className={`${getAttendanceColor()} text-white text-lg px-6 py-2`}>
              {summaryData.attendanceStatus}
            </Badge>
          </div>

          {summaryData.attendanceStatus === "Late" && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900 text-center">
                Late check-in may impact incentive eligibility
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== PENALTIES (IF ANY) ====== */}
      {summaryData.penalties && summaryData.penalties.length > 0 && (
        <Card className="mb-4 border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              Performance Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summaryData.penalties.map((penalty, index) => {
                const borderColor =
                  penalty.severity === "high"
                    ? "border-red-300"
                    : penalty.severity === "medium"
                    ? "border-amber-300"
                    : "border-orange-200";
                const iconColor =
                  penalty.severity === "high"
                    ? "text-red-600"
                    : penalty.severity === "medium"
                    ? "text-amber-600"
                    : "text-orange-600";
                const textColor =
                  penalty.severity === "high"
                    ? "text-red-900"
                    : penalty.severity === "medium"
                    ? "text-amber-900"
                    : "text-orange-900";

                return (
                  <div
                    key={index}
                    className={`p-3 bg-white border-2 ${borderColor} rounded-lg flex items-start gap-2`}
                  >
                    <AlertCircle className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                    <p className={`text-sm ${textColor} font-medium`}>{penalty.message}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== BONUSES (IF ANY) ====== */}
      {summaryData.bonuses && summaryData.bonuses.length > 0 && (
        <Card className="mb-4 border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Award className="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summaryData.bonuses.map((bonus, index) => (
                <div
                  key={index}
                  className="p-3 bg-white border border-green-200 rounded-lg flex items-start gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-900">{bonus}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== DATA LOCKED NOTICE ====== */}
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg mb-4">
        <p className="text-sm text-gray-700 text-center">
          🔒 Day closed — data locked and submitted to system
        </p>
      </div>

      {/* ====== ACTION BUTTON ====== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button
          onClick={onClose}
          className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
