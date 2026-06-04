// Performance Status Indicator
// Shows real-time performance tracking to washer
import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "../ui/badge";

export type PerformanceState = "on-track" | "behind-schedule" | "action-required";

export interface PerformanceStatusProps {
  status: PerformanceState;
  message?: string;
}

export function PerformanceStatus({ status, message }: PerformanceStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "on-track":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: "bg-green-100 text-green-700 border-green-300",
          label: "On Track",
          defaultMessage: "You're meeting your daily targets",
        };
      case "behind-schedule":
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: "bg-amber-100 text-amber-700 border-amber-300",
          label: "Behind Schedule",
          defaultMessage: "Speed up to meet daily targets",
        };
      case "action-required":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: "bg-red-100 text-red-700 border-red-300",
          label: "Action Required",
          defaultMessage: "Immediate attention needed",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className={`${config.color} border px-3 py-1.5 text-sm font-semibold`}>
            <span className="mr-1.5">{config.icon}</span>
            {config.label}
          </Badge>
        </div>
        <p className="text-xs text-gray-600">
          {message || config.defaultMessage}
        </p>
      </div>
    </div>
  );
}
