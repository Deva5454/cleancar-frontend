/**
 * EventBadge - Subtle event indicator for CRM actions
 * Shows what system events are triggered by user actions
 * NON-DESTRUCTIVE: Overlays on existing buttons/cards
 */

import { Badge } from "../ui/badge";
import { Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export type SystemEvent =
  | "LEAD_CREATED"
  | "LEAD_ASSIGNED"
  | "LEAD_QUALIFIED"
  | "DEMO_SCHEDULED"
  | "DEMO_COMPLETED"
  | "TRIAL_STARTED"
  | "DEAL_WON"
  | "DEAL_LOST"
  | "DEMO_FOLLOW_UP_REQUIRED"
  | "PAYMENT_RECEIVED"
  | "SUBSCRIPTION_ACTIVATED";

interface EventBadgeProps {
  event: SystemEvent;
  variant?: "subtle" | "prominent";
  position?: "top-right" | "inline";
}

const EVENT_LABELS: Record<SystemEvent, string> = {
  LEAD_CREATED: "Lead Created",
  LEAD_ASSIGNED: "Lead Assigned",
  LEAD_QUALIFIED: "Lead Qualified",
  DEMO_SCHEDULED: "Demo Scheduled",
  DEMO_COMPLETED: "Demo Completed",
  TRIAL_STARTED: "Trial Started",
  DEAL_WON: "Deal Won",
  DEAL_LOST: "Deal Lost",
  DEMO_FOLLOW_UP_REQUIRED: "Follow-up Required",
  PAYMENT_RECEIVED: "Payment Received",
  SUBSCRIPTION_ACTIVATED: "Subscription Active",
};

const EVENT_COLORS: Record<SystemEvent, string> = {
  LEAD_CREATED: "bg-gray-100 text-gray-700",
  LEAD_ASSIGNED: "bg-blue-100 text-blue-700",
  LEAD_QUALIFIED: "bg-purple-100 text-purple-700",
  DEMO_SCHEDULED: "bg-teal-100 text-teal-700",
  DEMO_COMPLETED: "bg-indigo-100 text-indigo-700",
  TRIAL_STARTED: "bg-yellow-100 text-yellow-700",
  DEAL_WON: "bg-green-100 text-green-700",
  DEAL_LOST: "bg-red-100 text-red-700",
  DEMO_FOLLOW_UP_REQUIRED: "bg-orange-100 text-orange-700",
  PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-700",
  SUBSCRIPTION_ACTIVATED: "bg-green-100 text-green-700",
};

export function EventBadge({ event, variant = "subtle", position = "inline" }: EventBadgeProps) {
  const isSubtle = variant === "subtle";
  const colorClass = EVENT_COLORS[event];

  if (position === "top-right") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute -top-2 -right-2">
              <Badge
                variant="outline"
                className={`${colorClass} text-xs px-1.5 py-0.5 flex items-center gap-1 border shadow-sm`}
              >
                <Zap className="w-3 h-3" />
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              <span className="font-semibold">Triggers:</span> {EVENT_LABELS[event]}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isSubtle ? "outline" : "default"}
            className={`${colorClass} text-xs flex items-center gap-1 ${
              isSubtle ? "opacity-70 hover:opacity-100" : ""
            }`}
          >
            <Zap className="w-3 h-3" />
            {!isSubtle && <span>{EVENT_LABELS[event]}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            <span className="font-semibold">System Event:</span> {event}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * EventTriggerLabel - Shows what event is triggered by an action
 * Use below buttons or on cards to indicate automation
 */
interface EventTriggerLabelProps {
  event: SystemEvent;
  className?: string;
}

export function EventTriggerLabel({ event, className = "" }: EventTriggerLabelProps) {
  return (
    <div className={`text-xs text-gray-500 flex items-center gap-1 ${className}`}>
      <Zap className="w-3 h-3 text-purple-500" />
      <span>
        Triggers: <span className="font-medium text-gray-700">{EVENT_LABELS[event]}</span>
      </span>
    </div>
  );
}
