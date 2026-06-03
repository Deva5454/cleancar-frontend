// System Tracking Indicator
// Subtle indicator that shows washer their activity is monitored
import { Eye, Activity } from "lucide-react";

export interface SystemTrackingIndicatorProps {
  variant?: "default" | "minimal";
}

export function SystemTrackingIndicator({ variant = "default" }: SystemTrackingIndicatorProps) {
  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Activity className="w-3 h-3" />
        <span>Activity tracked</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-2 text-gray-700">
        <Eye className="w-4 h-4 text-gray-500" />
        <span className="text-sm">
          Your activity is being tracked in real-time
        </span>
      </div>
    </div>
  );
}
