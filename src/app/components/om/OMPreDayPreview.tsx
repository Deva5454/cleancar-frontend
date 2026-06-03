/**
 * OPERATIONS MANAGER: PRE-DAY PREVIEW
 * Displayed previous night / early morning
 * Shows: Attendance projection, cover needs, scheduled visits, open escalations
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar, Users, MapPin, AlertTriangle, TrendingUp, Clock, CheckCircle } from "lucide-react";
import type { PreDayData, VisitPriority } from "../../types/operationsManager.types";

export interface OMPreDayPreviewProps {
  data: PreDayData;
  onPlanDay: () => void;
  onViewEscalations: () => void;
  onScheduleVisit: () => void;
  onBypass?: () => void; // Add bypass handler
}

const PRIORITY_CONFIG: Record<VisitPriority, { bgClass: string; textClass: string }> = {
  HIGH: { bgClass: "bg-red-600", textClass: "text-white" },
  MEDIUM: { bgClass: "bg-yellow-600", textClass: "text-white" },
  LOW: { bgClass: "bg-green-600", textClass: "text-white" }
};

function calculateAttendanceRisk(data: PreDayData): boolean {
  return data.attendance.projected < data.attendance.expected * 0.9;
}

function calculateCoverRisk(data: PreDayData): boolean {
  return data.coverRequirement.shortfall > 0;
}

function calculateEscalationRisk(data: PreDayData): boolean {
  return data.openEscalations.critical > 0;
}

export function OMPreDayPreview({
  data,
  onPlanDay,
  onViewEscalations,
  onScheduleVisit,
  onBypass,
}: OMPreDayPreviewProps) {
  const attendanceRisk = calculateAttendanceRisk(data);
  const coverRisk = calculateCoverRisk(data);
  const escalationRisk = calculateEscalationRisk(data);
  const hasAnyRisk = attendanceRisk || coverRisk || escalationRisk;

  const attendancePercentage = (data.attendance.projected / data.attendance.expected) * 100;
  const performancePercentage = data.yesterdayPerformance.percentage;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Badge className="bg-indigo-400 text-white px-4 py-2 mb-3 text-sm">
            Pre-Day Preview
          </Badge>
          <h1 className="text-4xl font-bold text-white mb-2">
            {data.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h1>
          <p className="text-indigo-200">
            Plan your day • Identify risks • Prepare for execution
          </p>
        </div>

        {/* RISK SUMMARY BANNER */}
        {hasAnyRisk && (
          <Card className="bg-red-500 border-red-600 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <AlertTriangle className="h-6 w-6 text-white" />
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">⚠️ Pre-Day Risks Detected</h3>
                  <div className="flex gap-4 mt-2 text-sm text-white">
                    {attendanceRisk && <span>• Low attendance projection</span>}
                    {coverRisk && <span>• Cover shortfall</span>}
                    {escalationRisk && <span>• Critical escalations pending</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* MAIN PREVIEW GRID */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* ATTENDANCE PROJECTION */}
          <Card className={attendanceRisk ? "border-2 border-red-400" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Attendance Projection</h2>
              </div>

              <div className="space-y-4">
                {/* Expected vs Projected */}
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Expected</span>
                  <span className="text-2xl font-bold text-gray-900">{data.attendance.expected}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Projected</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">{data.attendance.projected}</span>
                    <Badge className={`ml-2 ${
                      attendanceRisk ? "bg-red-600" : "bg-green-600"
                    } text-white`}>
                      {attendancePercentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-600 mb-1">Confirmed</p>
                    <p className="text-lg font-bold text-green-600">{data.attendance.confirmed}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-600 mb-1">Leave</p>
                    <p className="text-lg font-bold text-orange-600">{data.attendance.leavePlanned}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="text-xs text-gray-600 mb-1">Uncertain</p>
                    <p className="text-lg font-bold text-red-600">{data.attendance.uncertainty}</p>
                  </div>
                </div>

                {attendanceRisk && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                    <p className="text-sm text-red-900 font-semibold">
                      ⚠️ Action Required: Arrange backup or redistribute load
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* COVER REQUIREMENT */}
          <Card className={coverRisk ? "border-2 border-red-400" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Cover Requirement</h2>
              </div>

              <div className="space-y-4">
                {/* Estimated Cover Units */}
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-700">Estimated Cover Units</span>
                  <span className="text-2xl font-bold text-gray-900">{data.coverRequirement.estimatedUnits}</span>
                </div>

                {/* Washers Needed */}
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Cover Washers Needed</span>
                  <span className="text-2xl font-bold text-gray-900">{data.coverRequirement.coverWashersNeeded}</span>
                </div>

                {/* Pool vs Shortfall */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-green-50 rounded text-center">
                    <p className="text-xs text-gray-600 mb-1">Current Pool</p>
                    <p className="text-2xl font-bold text-green-600">{data.coverRequirement.currentCoverPool}</p>
                  </div>
                  <div className={`p-3 rounded text-center ${
                    coverRisk ? "bg-red-50" : "bg-gray-50"
                  }`}>
                    <p className="text-xs text-gray-600 mb-1">Shortfall</p>
                    <p className={`text-2xl font-bold ${
                      coverRisk ? "text-red-600" : "text-gray-900"
                    }`}>
                      {data.coverRequirement.shortfall}
                    </p>
                  </div>
                </div>

                {coverRisk && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                    <p className="text-sm text-red-900 font-semibold">
                      ⚠️ Action Required: Recruit backup cover washers
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SCHEDULED VISITS */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <MapPin className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Scheduled Visits</h2>
              </div>
              <Badge className="bg-green-600 text-white px-3 py-1">
                {data.scheduledVisits.length} visits
              </Badge>
            </div>

            {data.scheduledVisits.length > 0 ? (
              <div className="space-y-3">
                {data.scheduledVisits.map((visit) => {
                  const priorityConfig = PRIORITY_CONFIG[visit.priority];
                  
                  return (
                    <div
                      key={visit.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-400 transition-colors"
                    >
                      <Clock className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{visit.customerName}</p>
                        <p className="text-sm text-gray-600">{visit.location}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-gray-200 text-gray-700 mb-1">
                          {visit.type}
                        </Badge>
                        <p className="text-sm font-semibold text-gray-900">{visit.scheduledTime}</p>
                      </div>
                      <Badge className={`${priorityConfig.bgClass} ${priorityConfig.textClass}`}>
                        {visit.priority}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No visits scheduled for tomorrow</p>
                <Button
                  onClick={onScheduleVisit}
                  className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                >
                  Schedule Visit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* OPEN ESCALATIONS & YESTERDAY PERFORMANCE */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* OPEN ESCALATIONS */}
          <Card className={escalationRisk ? "border-2 border-red-400" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">Open Escalations</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-700">Critical</span>
                  <span className="text-2xl font-bold text-red-600">{data.openEscalations.critical}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm text-gray-700">High</span>
                  <span className="text-2xl font-bold text-orange-600">{data.openEscalations.high}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm text-gray-700">Medium</span>
                  <span className="text-2xl font-bold text-yellow-600">{data.openEscalations.medium}</span>
                </div>

                {escalationRisk && (
                  <Button
                    onClick={onViewEscalations}
                    className="w-full bg-red-600 hover:bg-red-700 text-white mt-2"
                  >
                    Clear Critical Escalations
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* YESTERDAY PERFORMANCE */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Yesterday's Performance</h2>
              </div>

              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Units Achieved</p>
                  <p className="text-4xl font-bold text-gray-900 mb-1">
                    {data.yesterdayPerformance.unitsAchieved.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Target: {data.yesterdayPerformance.unitsTarget}
                  </p>
                  <Badge className={`mt-2 ${
                    performancePercentage >= 100 ? "bg-green-600" :
                    performancePercentage >= 90 ? "bg-yellow-600" :
                    "bg-red-600"
                  } text-white text-lg px-4 py-1`}>
                    {performancePercentage.toFixed(0)}%
                  </Badge>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 text-center">
                    {performancePercentage >= 100
                      ? "✓ Exceeded target — Maintain momentum"
                      : performancePercentage >= 90
                      ? "⚠️ Close to target — Push for 100%"
                      : "🔴 Below target — Focus on improvement"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ACTION BUTTON */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Ready to Start Your Day?</h3>
              <p className="text-indigo-100 mb-4">
                Review risks, plan actions, and execute with confidence
              </p>
              <Button
                onClick={onPlanDay}
                size="lg"
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8"
              >
                Start Day Planning →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}