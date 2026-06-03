// Check-In Success Banner - Shown immediately after check-in
// Redirects to dashboard and highlights first job
import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { CheckCircle, Play, Clock } from "lucide-react";

export interface CheckInSuccessBannerProps {
  checkInTime: string;
  firstJobTimeSlot?: string;
  onDismiss?: () => void;
}

export function CheckInSuccessBanner({
  checkInTime,
  firstJobTimeSlot,
  onDismiss,
}: CheckInSuccessBannerProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      setShow(false);
      if (onDismiss) {
        setTimeout(onDismiss, 300); // Wait for fade animation
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!show) return null;

  return (
    <Card
      className={`border-2 border-green-300 bg-green-50 transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1 animate-pulse" />
          <div className="flex-1">
            <p className="font-bold text-lg text-green-900 mb-1">
              ✅ Check-in Successful
            </p>
            <p className="text-sm text-green-800 mb-3">
              Checked in at <strong>{checkInTime}</strong> — Timer started
            </p>

            {/* First Job Alert */}
            <div className="p-3 bg-white border-2 border-amber-300 rounded-lg flex items-start gap-2">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900 mb-1">
                  ⏰ Start your first wash within 5 minutes
                </p>
                {firstJobTimeSlot && (
                  <p className="text-xs text-amber-800">
                    First job scheduled: {firstJobTimeSlot}
                  </p>
                )}
              </div>
            </div>

            {/* Timer Visual */}
            <div className="mt-3 flex items-center justify-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <p className="text-xs">Day timer is now running</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
