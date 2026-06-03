// Time Band Closed Banner - Shown when earning window closes
// Prevents new earnings but allows completing remaining jobs
import { Card, CardContent } from "../ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

export interface TimeBandClosedBannerProps {
  closedAt: string;
  remainingJobs: number;
  onProceedToCheckout?: () => void;
}

export function TimeBandClosedBanner({
  closedAt,
  remainingJobs,
  onProceedToCheckout,
}: TimeBandClosedBannerProps) {
  return (
    <Card className="border-2 border-amber-300 bg-amber-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="font-bold text-lg text-amber-900 mb-1">Work Window Closed</p>
            <p className="text-sm text-amber-800 mb-3">
              Earning period ended at {closedAt}. New jobs will not generate incentive earnings.
            </p>

            {remainingJobs > 0 ? (
              <div className="p-3 bg-amber-100 border border-amber-200 rounded-lg mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <p className="text-sm text-amber-900">
                    <strong>{remainingJobs}</strong> job{remainingJobs > 1 ? "s" : ""} remaining
                    — complete them before check-out
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-100 border border-green-200 rounded-lg mb-3">
                <p className="text-sm text-green-900 font-semibold text-center">
                  ✅ All jobs completed — proceed to check-out
                </p>
              </div>
            )}

            {remainingJobs === 0 && onProceedToCheckout && (
              <Button
                onClick={onProceedToCheckout}
                className="w-full h-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                Proceed to Check-out
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
