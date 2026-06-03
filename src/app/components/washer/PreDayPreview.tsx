// Pre-Day Preview - Optional card showing tomorrow's schedule
// Displays on previous day or upon login
import { Card, CardContent } from "../ui/card";
import { Calendar, Target, Info } from "lucide-react";
import { Badge } from "../ui/badge";

export interface PreDayPreviewProps {
  date: string;
  totalAssignedUnits: number;
  isWeekOff: boolean;
  baseTarget: number;
  coverJobs?: number;
}

export function PreDayPreview({
  date,
  totalAssignedUnits,
  isWeekOff,
  baseTarget,
  coverJobs = 0,
}: PreDayPreviewProps) {
  if (isWeekOff) {
    return (
      <Card className="border-2 border-purple-300 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="text-4xl">📅</div>
            <div className="flex-1">
              <p className="font-bold text-lg text-purple-900">Tomorrow is your week-off</p>
              <p className="text-sm text-purple-700">
                {new Date(date).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-300 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="font-bold text-lg text-blue-900">Tomorrow's schedule is ready</p>
            <p className="text-sm text-blue-700 mb-3">
              {new Date(date).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {/* Total Units */}
              <div className="p-3 bg-white rounded-lg border border-blue-200 text-center">
                <p className="text-xs text-gray-600 mb-1">Total Units</p>
                <p className="text-2xl font-bold text-blue-600">{totalAssignedUnits}</p>
              </div>

              {/* Base Target */}
              <div className="p-3 bg-white rounded-lg border border-blue-200 text-center">
                <p className="text-xs text-gray-600 mb-1">Base Target</p>
                <p className="text-2xl font-bold text-green-600">{baseTarget}</p>
              </div>
            </div>

            {/* Cover Jobs Badge */}
            {coverJobs > 0 && (
              <div className="mt-3 p-2 bg-teal-100 border border-teal-200 rounded flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                <p className="text-xs text-teal-900">
                  Includes <strong>{coverJobs}</strong> cover job{coverJobs > 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Info Note */}
            <div className="mt-3 p-2 bg-blue-100 rounded flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900">
                Check in on time to start your day. Incentives unlock after {baseTarget} units.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
