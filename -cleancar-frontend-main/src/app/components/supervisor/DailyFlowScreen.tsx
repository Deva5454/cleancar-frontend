/**
 * MODULE 10: Daily Process Flow Screen
 * Timeline-based workflow tracker from pre-day to midnight
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CheckCircle, Clock, XCircle, ChevronRight } from "lucide-react";
import type { FlowStage, DailyFlowSummary } from "../../services/dailyFlowService";

export interface DailyFlowScreenProps {
  stages: FlowStage[];
  summary: DailyFlowSummary;
  onCompleteAction?: (stageId: string, actionId: string) => void;
}

export function DailyFlowScreen({ stages, summary, onCompleteAction }: DailyFlowScreenProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-300",
          label: "Completed",
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-300",
          label: "In Progress",
        };
      case "MISSED":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-300",
          label: "Missed",
        };
      case "UPCOMING":
        return {
          icon: Clock,
          color: "text-gray-400",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-300",
          label: "Upcoming",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-300",
          label: "Unknown",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-teal-600 to-teal-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Daily Flow Tracker</h1>
          <p className="text-sm text-teal-100">Pre-Day to Midnight</p>
        </div>

        {/* Progress Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-teal-100">Overall Progress</span>
            <span className="text-lg font-bold">{summary.overallProgress}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: `${summary.overallProgress}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <p className="text-teal-100">Completed</p>
              <p className="font-bold">
                {summary.completedStages}/{summary.totalStages}
              </p>
            </div>
            <div>
              <p className="text-teal-100">Current</p>
              <p className="font-bold text-xs">{summary.currentStage}</p>
            </div>
            <div>
              <p className="text-teal-100">Missed Critical</p>
              <p className="font-bold">{summary.missedCritical}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* TIMELINE */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />

          <div className="space-y-4">
            {stages.map((stage, index) => {
              const config = getStatusConfig(stage.status);
              const StatusIcon = config.icon;

              return (
                <div key={stage.id} className="relative pl-14">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-3 top-3 w-6 h-6 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}
                  >
                    <StatusIcon className={`h-4 w-4 ${config.color}`} />
                  </div>

                  {/* Stage card */}
                  <Card
                    className={`border-2 ${config.borderColor} ${config.bgColor} ${
                      stage.status === "PENDING" ? "shadow-md" : ""
                    }`}
                  >
                    <CardContent className="p-3">
                      {/* Row 1: Time + Label */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-600">
                              {stage.time}
                            </span>
                            {stage.isCritical && (
                              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                                Critical
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-sm text-gray-900">{stage.label}</h3>
                          <p className="text-xs text-gray-600">{stage.description}</p>
                        </div>
                        <Badge variant="outline" className={`${config.color} border-current ml-2`}>
                          {config.label}
                        </Badge>
                      </div>

                      {/* Row 2: Actions checklist */}
                      {stage.actions.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {stage.actions.map((action) => (
                            <div
                              key={action.id}
                              className="flex items-center justify-between p-2 bg-white/50 rounded border border-gray-200"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                    action.completed
                                      ? "bg-green-500 border-green-500"
                                      : "border-gray-400"
                                  }`}
                                >
                                  {action.completed && (
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span className="text-xs text-gray-700">{action.label}</span>
                              </div>
                              {action.isMandatory && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Row 3: Completion time (if completed) */}
                      {stage.completedAt && (
                        <div className="mt-2 text-xs text-gray-600">
                          ✓ Completed at {stage.completedAt.toLocaleTimeString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Missed Alert */}
        {summary.missedCritical > 0 && (
          <Card className="border-2 border-red-300 bg-red-50 mt-4">
            <CardContent className="p-3 text-center">
              <p className="text-sm font-semibold text-red-700">
                ⚠️ {summary.missedCritical} Critical Step{summary.missedCritical > 1 ? "s" : ""} Missed
              </p>
              <p className="text-xs text-red-600 mt-1">
                Review and complete missed critical steps
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Notice */}
        <Card className="border-2 border-gray-300 bg-gray-50 mt-4">
          <CardContent className="p-3 text-center">
            <p className="text-xs font-semibold text-gray-700">
              ℹ️ Timeline updates automatically based on completed actions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
