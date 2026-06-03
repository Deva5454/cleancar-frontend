// Job Activity Tracker
// Shows real-time activity tracking during job execution
import { useState, useEffect } from "react";
import { Clock, Activity } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export interface JobActivityTrackerProps {
  jobId: string;
  startTime?: Date;
  showTimestamps?: boolean;
}

export function JobActivityTracker({
  jobId,
  startTime = new Date(),
  showTimestamps = false,
}: JobActivityTrackerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="border-2 border-teal-300 bg-teal-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-teal-900">
                Job in Progress
              </p>
              <p className="text-xs text-teal-700 mt-0.5">
                Activity is being recorded
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-teal-900">
              <Clock className="w-4 h-4" />
              <span className="text-2xl font-bold font-mono">{formatTime(elapsed)}</span>
            </div>
          </div>
        </div>

        {showTimestamps && (
          <div className="mt-3 pt-3 border-t border-teal-200">
            <p className="text-xs text-teal-700">
              Step timestamps recorded automatically
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
