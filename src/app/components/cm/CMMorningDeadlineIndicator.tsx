/**
 * MORNING DEADLINE INDICATOR (V7 - MORNING MODE)
 * Shows pending actions that must be cleared by 11:30 AM
 * Displayed during Morning Review Mode (10 AM - 11:30 AM)
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface CMMorningDeadlineIndicatorProps {
  pendingCount: number;
  deadlineHour: number; // 11.5 for 11:30 AM
  onNavigateToActions: () => void;
}

export function CMMorningDeadlineIndicator({
  pendingCount,
  deadlineHour,
  onNavigateToActions,
}: CMMorningDeadlineIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<"GOOD" | "WARNING" | "CRITICAL">("GOOD");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;

      // Calculate deadline time
      const deadline = new Date();
      deadline.setHours(Math.floor(deadlineHour));
      deadline.setMinutes((deadlineHour % 1) * 60);
      deadline.setSeconds(0);

      const minutesRemaining = Math.floor((deadline.getTime() - now.getTime()) / 60000);

      if (minutesRemaining <= 0) {
        setTimeRemaining("Deadline passed");
        setUrgencyLevel("CRITICAL");
      } else if (minutesRemaining < 30) {
        setTimeRemaining(`${minutesRemaining} minutes`);
        setUrgencyLevel("CRITICAL");
      } else if (minutesRemaining < 60) {
        setTimeRemaining(`${minutesRemaining} minutes`);
        setUrgencyLevel("WARNING");
      } else {
        const hours = Math.floor(minutesRemaining / 60);
        const mins = minutesRemaining % 60;
        setTimeRemaining(`${hours}h ${mins}m`);
        setUrgencyLevel("GOOD");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadlineHour]);

  if (pendingCount === 0) {
    return null;
  }

  const getUrgencyConfig = () => {
    if (urgencyLevel === "CRITICAL") {
      return {
        bgColor: "bg-red-100",
        borderColor: "border-red-600",
        textColor: "text-red-900",
        badgeColor: "bg-red-600",
        icon: <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />,
      };
    }
    if (urgencyLevel === "WARNING") {
      return {
        bgColor: "bg-amber-100",
        borderColor: "border-amber-600",
        textColor: "text-amber-900",
        badgeColor: "bg-amber-600",
        icon: <Clock className="w-5 h-5 text-amber-600" />,
      };
    }
    return {
      bgColor: "bg-blue-100",
      borderColor: "border-blue-600",
      textColor: "text-blue-900",
      badgeColor: "bg-blue-600",
      icon: <Clock className="w-5 h-5 text-blue-600" />,
    };
  };

  const config = getUrgencyConfig();

  return (
    <Card className={`p-4 border-2 ${config.borderColor} ${config.bgColor} ${urgencyLevel === "CRITICAL" ? "animate-pulse" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {config.icon}
          <div>
            <h4 className={`font-semibold ${config.textColor}`}>
              {urgencyLevel === "CRITICAL" ? "URGENT:" : ""} {pendingCount} Pending Actions
            </h4>
            <p className={`text-sm ${config.textColor}`}>
              Must clear by 11:30 AM • <strong>{timeRemaining} remaining</strong>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Badge className={`${config.badgeColor} text-white text-lg px-3 py-1`}>
            {pendingCount}
          </Badge>
          <Button
            onClick={onNavigateToActions}
            className={`gap-2 ${config.badgeColor} hover:opacity-90`}
          >
            Clear Now
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
