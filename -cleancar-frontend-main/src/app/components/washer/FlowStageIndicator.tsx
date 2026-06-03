// Flow Stage Indicator - Shows current stage in daily journey
// Guides washer through the day systematically
import { CheckCircle, Circle, Lock } from "lucide-react";

export type DayStage =
  | "pre-day"
  | "check-in"
  | "base-execution"
  | "incentive-unlocked"
  | "time-closed"
  | "check-out"
  | "day-complete";

export interface FlowStageIndicatorProps {
  currentStage: DayStage;
  baseUnits: number;
  baseTarget: number;
  isTimeBandActive: boolean;
}

export function FlowStageIndicator({
  currentStage,
  baseUnits,
  baseTarget,
  isTimeBandActive,
}: FlowStageIndicatorProps) {
  const stages = [
    {
      id: "check-in" as DayStage,
      label: "Check In",
      description: "Start your day",
    },
    {
      id: "base-execution" as DayStage,
      label: "Base Work",
      description: `Complete ${baseTarget} units`,
    },
    {
      id: "incentive-unlocked" as DayStage,
      label: "Incentives",
      description: "Earning phase",
    },
    {
      id: "check-out" as DayStage,
      label: "Check Out",
      description: "End your day",
    },
  ];

  const getStageIndex = (stage: DayStage): number => {
    const stageOrder = ["pre-day", "check-in", "base-execution", "incentive-unlocked", "time-closed", "check-out", "day-complete"];
    return stageOrder.indexOf(stage);
  };

  const currentStageIndex = getStageIndex(currentStage);

  const isStageComplete = (stage: DayStage): boolean => {
    return getStageIndex(stage) < currentStageIndex;
  };

  const isCurrentStage = (stage: DayStage): boolean => {
    if (currentStage === "time-closed" && stage === "incentive-unlocked") return true;
    return stage === currentStage;
  };

  const isStageLocked = (stage: DayStage): boolean => {
    return getStageIndex(stage) > currentStageIndex;
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const isComplete = isStageComplete(stage.id);
          const isCurrent = isCurrentStage(stage.id);
          const isLocked = isStageLocked(stage.id);

          return (
            <div key={stage.id} className="flex items-center flex-1">
              {/* Stage Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    isComplete
                      ? "bg-green-500 border-green-600"
                      : isCurrent
                      ? "bg-blue-500 border-blue-600 animate-pulse"
                      : "bg-gray-200 border-gray-300"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : isLocked ? (
                    <Lock className="w-6 h-6 text-gray-500" />
                  ) : (
                    <Circle
                      className={`w-6 h-6 ${isCurrent ? "text-white" : "text-gray-400"}`}
                    />
                  )}
                </div>

                {/* Stage Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-semibold ${
                      isComplete || isCurrent ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p
                    className={`text-xs ${
                      isComplete || isCurrent ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {stage.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div
                  className={`h-0.5 flex-1 -mt-8 ${
                    isComplete ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Stage Message */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-semibold text-blue-900 text-center">
          {currentStage === "pre-day" && "👋 Ready to start your day?"}
          {currentStage === "check-in" && "⏰ Check in to begin work"}
          {currentStage === "base-execution" &&
            `🎯 Complete ${baseTarget - baseUnits} more units to unlock incentives`}
          {currentStage === "incentive-unlocked" && "💰 Incentives active — keep going!"}
          {currentStage === "time-closed" && "⏱️ Work window closed — proceed to check-out"}
          {currentStage === "check-out" && "📸 Complete check-out to finish your day"}
          {currentStage === "day-complete" && "✅ Day complete — great work!"}
        </p>
      </div>

      {/* Base Progress (during base-execution) */}
      {currentStage === "base-execution" && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Base Progress</span>
            <span className="text-xs font-bold text-gray-900">
              {baseUnits}/{baseTarget}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${Math.min((baseUnits / baseTarget) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Time Band Status */}
      {(currentStage === "base-execution" || currentStage === "incentive-unlocked") && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isTimeBandActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          ></div>
          <span className="text-xs font-medium text-gray-700">
            {isTimeBandActive ? "Earning window active" : "Outside earning window"}
          </span>
        </div>
      )}
    </div>
  );
}
