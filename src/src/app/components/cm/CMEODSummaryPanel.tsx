/**
 * EOD SUMMARY SUBMISSION PANEL (V7 - PLANNING MODE)
 * End-of-day summary submission for CM
 * Displayed during Planning Mode (5 PM - 8 PM)
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  CheckCircle2,
  Send,
  TrendingUp,
  Target,
  AlertTriangle,
  Calendar,
  Edit,
} from "lucide-react";
import type { EODSummary } from "../../types/clusterManager.types";
import { clusterManagerService } from "../../services/clusterManagerService";

interface CMEODSummaryPanelProps {
  summary: EODSummary;
  onSubmit?: () => void;
}

export function CMEODSummaryPanel({ summary, onSubmit }: CMEODSummaryPanelProps) {
  const revenuePercentage = (summary.todayPerformance.revenueAchieved / summary.todayPerformance.revenueTarget) * 100;
  const unitsPercentage = (summary.todayPerformance.unitsCompleted / summary.todayPerformance.unitsTarget) * 100;

  const handleSubmit = () => {
    clusterManagerService.submitEODSummary(summary);
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 border-2 border-purple-600 bg-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900">End-of-Day Summary</h3>
              <p className="text-sm text-purple-700">
                {summary.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <Badge
            className={`${
              summary.status === "SUBMITTED" ? "bg-green-600" : "bg-amber-600"
            } text-white`}
          >
            {summary.status === "SUBMITTED" ? "Submitted" : "Draft"}
          </Badge>
        </div>
      </Card>

      {/* Today's Performance */}
      <Card className="p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-slate-700" />
          <h4 className="font-semibold text-slate-900">Today's Performance</h4>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Revenue Card */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Revenue</span>
              <Badge
                className={`${
                  revenuePercentage >= 100 ? "bg-green-600" : revenuePercentage >= 90 ? "bg-amber-600" : "bg-red-600"
                } text-white`}
              >
                {revenuePercentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Achieved:</span>
                <span className="font-semibold text-slate-900">
                  ₹{(summary.todayPerformance.revenueAchieved / 100000).toFixed(2)}L
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Target:</span>
                <span className="font-semibold text-slate-900">
                  ₹{(summary.todayPerformance.revenueTarget / 100000).toFixed(2)}L
                </span>
              </div>
            </div>
          </div>

          {/* Units Card */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Units</span>
              <Badge
                className={`${
                  unitsPercentage >= 100 ? "bg-green-600" : unitsPercentage >= 90 ? "bg-amber-600" : "bg-red-600"
                } text-white`}
              >
                {unitsPercentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Completed:</span>
                <span className="font-semibold text-slate-900">
                  {summary.todayPerformance.unitsCompleted.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Target:</span>
                <span className="font-semibold text-slate-900">
                  {summary.todayPerformance.unitsTarget.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <span className="text-xs text-blue-700">Escalations Handled</span>
            <p className="text-2xl font-bold text-blue-900">{summary.escalationsHandled}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <span className="text-xs text-purple-700">Interventions Taken</span>
            <p className="text-2xl font-bold text-purple-900">{summary.interventionsTaken}</p>
          </div>
        </div>
      </Card>

      {/* Next Day Planning */}
      <Card className="p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-slate-700" />
          <h4 className="font-semibold text-slate-900">Next Day Planning</h4>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-600">Expected Revenue</span>
              <p className="text-lg font-semibold text-slate-900">
                ₹{(summary.nextDayPlanning.expectedRevenue / 100000).toFixed(1)}L
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-600">Expected Units</span>
              <p className="text-lg font-semibold text-slate-900">
                {summary.nextDayPlanning.expectedUnits.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className={`w-4 h-4 ${summary.nextDayPlanning.coverageConfirmed ? "text-green-600" : "text-red-600"}`} />
              <span className="text-sm font-medium text-slate-900">
                Coverage Status: {summary.nextDayPlanning.coverageConfirmed ? "Confirmed" : "Not Confirmed"}
              </span>
            </div>
          </div>

          {summary.nextDayPlanning.knownIssues.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-900">Known Issues for Tomorrow</span>
              </div>
              <ul className="space-y-1">
                {summary.nextDayPlanning.knownIssues.map((issue, index) => (
                  <li key={index} className="text-sm text-amber-800">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Submission Actions */}
      <div className="flex gap-2">
        {summary.status === "DRAFT" && (
          <>
            <Button variant="outline" className="flex-1 gap-2">
              <Edit className="w-4 h-4" />
              Edit Details
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
              Submit to City Manager
            </Button>
          </>
        )}
        {summary.status === "SUBMITTED" && (
          <Card className="w-full p-3 bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-900 font-medium">
                EOD Summary Submitted at {summary.submittedAt?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
