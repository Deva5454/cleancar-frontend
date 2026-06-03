// Incentive Unlock Banner - Celebratory moment when base completes
// Shows animation and transitions UI to incentive earning mode
import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Sparkles, Award, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";

export interface IncentiveUnlockBannerProps {
  onAcknowledge: () => void;
  incentiveRate: number;
}

export function IncentiveUnlockBanner({
  onAcknowledge,
  incentiveRate,
}: IncentiveUnlockBannerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <Card
        className={`border-4 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 max-w-md w-full transform transition-all duration-700 ${
          show ? "scale-100 rotate-0" : "scale-50 rotate-12"
        }`}
      >
        <CardContent className="p-6 text-center">
          {/* Animated Icon */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-green-500 rounded-full p-6">
                <Sparkles className="w-16 h-16 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Congratulations Message */}
          <h2 className="text-3xl font-bold text-green-900 mb-2">
            🎉 Congratulations!
          </h2>
          <p className="text-xl font-semibold text-green-800 mb-4">
            Base Quota Complete
          </p>

          <div className="text-6xl mb-4">✨</div>

          {/* Unlock Message */}
          <div className="p-4 bg-white border-2 border-green-300 rounded-lg mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-6 h-6 text-green-600" />
              <p className="text-lg font-bold text-green-900">Incentives Unlocked!</p>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              Every additional unit you complete now earns you money
            </p>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                ₹{incentiveRate} per unit
              </p>
            </div>
          </div>

          {/* Motivational Message */}
          <p className="text-sm text-green-800 mb-6 font-medium">
            Keep going to maximize your earnings for the day! 💪
          </p>

          {/* Acknowledge Button */}
          <Button
            onClick={onAcknowledge}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
          >
            Let's Go! 🚀
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
