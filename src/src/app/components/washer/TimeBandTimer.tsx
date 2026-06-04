/**
 * Time Band Timer Component
 * Shows dynamic 4-hour earning window from check-in
 * Design Principle: Clear countdown + status
 */

import { useEffect, useState } from "react";
import { Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export interface TimeBandTimerProps {
  checkInTime: Date;
  durationHours?: number; // Default 4 hours
  onExpire?: () => void;
}

export function TimeBandTimer({ 
  checkInTime, 
  durationHours = 4,
  onExpire 
}: TimeBandTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const expiryTime = new Date(checkInTime.getTime() + durationHours * 60 * 60 * 1000);
      const diffMs = expiryTime.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
        onExpire?.();
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeRemaining({ hours, minutes, seconds, totalSeconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [checkInTime, durationHours, onExpire]);

  const getStatusColor = () => {
    const totalMinutes = timeRemaining.hours * 60 + timeRemaining.minutes;
    if (totalMinutes <= 30) return "red"; // Last 30 mins - urgent
    if (totalMinutes <= 60) return "amber"; // Last 1 hour - warning
    return "green"; // Active
  };

  const getStatusText = () => {
    const totalMinutes = timeRemaining.hours * 60 + timeRemaining.minutes;
    if (totalMinutes === 0) return "CLOSED";
    if (totalMinutes <= 30) return "ENDING SOON";
    if (totalMinutes <= 60) return "ACTIVE";
    return "ACTIVE";
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();

  // Expired state
  if (timeRemaining.totalSeconds === 0) {
    return (
      <Card className="border-2 border-red-300 bg-red-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Earning window closed
              </p>
              <p className="text-xs text-gray-600 mt-1">
                New jobs will not generate incentive earnings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${
      statusColor === "red" ? "border-red-300 bg-red-50" :
      statusColor === "amber" ? "border-amber-300 bg-amber-50" :
      "border-green-300 bg-green-50"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              statusColor === "red" ? "bg-red-100" :
              statusColor === "amber" ? "bg-amber-100" :
              "bg-green-100"
            }`}>
              <Clock className={`h-5 w-5 ${
                statusColor === "red" ? "text-red-600" :
                statusColor === "amber" ? "text-amber-600" :
                "text-green-600"
              }`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Incentive Window
              </h3>
              <Badge 
                variant="outline" 
                className={`${
                  statusColor === "red" ? "bg-red-100 text-red-700 border-red-300" :
                  statusColor === "amber" ? "bg-amber-100 text-amber-700 border-amber-300" :
                  "bg-green-100 text-green-700 border-green-300"
                }`}
              >
                {statusText}
              </Badge>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`text-3xl font-bold tabular-nums ${
                statusColor === "red" ? "text-red-600" :
                statusColor === "amber" ? "text-amber-600" :
                "text-green-600"
              }`}>
                {String(timeRemaining.hours).padStart(2, '0')}:
                {String(timeRemaining.minutes).padStart(2, '0')}:
                {String(timeRemaining.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">
                remaining
              </div>
            </div>

            {/* Status message */}
            <div className={`flex items-center gap-2 text-sm ${
              statusColor === "red" ? "text-red-700" :
              statusColor === "amber" ? "text-amber-700" :
              "text-green-700"
            }`}>
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">
                {statusColor === "red" ? "Complete jobs quickly to earn!" :
                 statusColor === "amber" ? "Earning window closing soon" :
                 "Earnings active — keep going!"}
              </span>
            </div>

            {/* Additional info */}
            <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
              <p>
                <span className="font-medium">Started:</span> {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="mt-0.5">
                <span className="font-medium">Expires:</span> {new Date(checkInTime.getTime() + durationHours * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
