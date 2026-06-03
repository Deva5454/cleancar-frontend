/**
 * DemoOutcomeSelector - Enhanced demo completion with event mapping
 * Shows outcome options and their triggered events
 * NON-DESTRUCTIVE: Can be added to existing demo completion UI
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Meh,
} from "lucide-react";
import { EventTriggerLabel, type SystemEvent } from "./EventBadge";

interface DemoOutcome {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  systemEvent: SystemEvent;
  actions: string[];
}

const DEMO_OUTCOMES: DemoOutcome[] = [
  {
    id: "interested",
    label: "Interested - Start Trial",
    description: "Customer loved the demo and wants to try the service",
    icon: ThumbsUp,
    color: "green",
    systemEvent: "TRIAL_STARTED",
    actions: [
      "Create 7-day trial subscription",
      "Send welcome package to customer",
      "Schedule Day-5 reminder for conversion",
      "Move to 'Trial' pipeline stage",
    ],
  },
  {
    id: "follow-up",
    label: "Follow-up Required",
    description: "Customer needs time to decide, schedule follow-up",
    icon: Clock,
    color: "yellow",
    systemEvent: "DEMO_FOLLOW_UP_REQUIRED",
    actions: [
      "Schedule follow-up call (2 days)",
      "Send pricing & comparison template",
      "Keep in 'Demo Completed' stage",
      "Set reminder for TSE",
    ],
  },
  {
    id: "maybe",
    label: "Maybe Later",
    description: "Customer interested but not ready to commit now",
    icon: Meh,
    color: "orange",
    systemEvent: "DEMO_FOLLOW_UP_REQUIRED",
    actions: [
      "Schedule long-term follow-up (14 days)",
      "Add to nurture campaign",
      "Move to 'Nurture' stage",
    ],
  },
  {
    id: "closed-won",
    label: "Closed - Deal Won",
    description: "Customer ready to subscribe immediately (paid already)",
    icon: CheckCircle,
    color: "emerald",
    systemEvent: "DEAL_WON",
    actions: [
      "Create active subscription",
      "Generate invoice and payment link",
      "Assign to operations team",
      "Move to 'Closed Won' stage",
      "Update revenue forecast",
    ],
  },
  {
    id: "not-interested",
    label: "Not Interested",
    description: "Customer not interested, mark as lost",
    icon: XCircle,
    color: "red",
    systemEvent: "DEAL_LOST",
    actions: [
      "Archive lead with reason",
      "Schedule re-engagement (30 days)",
      "Move to 'Closed Lost' stage",
    ],
  },
];

interface DemoOutcomeSelectorProps {
  demoId: string;
  onSelect: (outcome: DemoOutcome, notes: string) => void;
}

export function DemoOutcomeSelector({ demoId, onSelect }: DemoOutcomeSelectorProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    const outcome = DEMO_OUTCOMES.find((o) => o.id === selectedOutcome);
    if (outcome) {
      onSelect(outcome, notes);
    }
  };

  const getColorClasses = (color: string) => {
    const classes: Record<string, { bg: string; border: string; text: string; hover: string }> = {
      green: {
        bg: "bg-green-50",
        border: "border-green-300",
        text: "text-green-700",
        hover: "hover:bg-green-100",
      },
      yellow: {
        bg: "bg-yellow-50",
        border: "border-yellow-300",
        text: "text-yellow-700",
        hover: "hover:bg-yellow-100",
      },
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-300",
        text: "text-orange-700",
        hover: "hover:bg-orange-100",
      },
      emerald: {
        bg: "bg-emerald-50",
        border: "border-emerald-300",
        text: "text-emerald-700",
        hover: "hover:bg-emerald-100",
      },
      red: {
        bg: "bg-red-50",
        border: "border-red-300",
        text: "text-red-700",
        hover: "hover:bg-red-100",
      },
    };
    return classes[color] || classes.green;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Demo Outcome & Next Steps
        </h3>
        <p className="text-sm text-gray-600">
          Select the outcome to trigger automated workflow
        </p>
      </div>

      {/* Outcome Options */}
      <div className="grid gap-3">
        {DEMO_OUTCOMES.map((outcome) => {
          const Icon = outcome.icon;
          const colors = getColorClasses(outcome.color);
          const isSelected = selectedOutcome === outcome.id;

          return (
            <Card
              key={outcome.id}
              className={`p-4 cursor-pointer transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.border} border-2 shadow-md`
                  : "border border-gray-200 hover:border-gray-300 hover:shadow"
              }`}
              onClick={() => setSelectedOutcome(outcome.id)}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{outcome.label}</h4>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{outcome.description}</p>
                </div>
              </div>

              {/* Event Trigger */}
              <div className="mb-3">
                <EventTriggerLabel event={outcome.systemEvent} />
              </div>

              {/* Automated Actions */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Automated Actions:
                  </p>
                  <ul className="space-y-1">
                    {outcome.actions.map((action, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs text-gray-700">
                        <TrendingUp className="w-3 h-3 text-purple-500" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Additional Notes */}
      {selectedOutcome && (
        <Card className="p-4 bg-gray-50">
          <Label htmlFor="outcome-notes" className="text-sm font-semibold mb-2 block">
            Additional Notes (Optional)
          </Label>
          <Textarea
            id="outcome-notes"
            placeholder="Add any additional context about the demo outcome..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mb-3"
          />
          <Button onClick={handleSubmit} className="w-full">
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm & Trigger Workflow
          </Button>
        </Card>
      )}

      {/* Event Flow Info */}
      <Card className="p-3 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-purple-600 mt-0.5" />
          <p className="text-xs text-purple-900">
            <span className="font-semibold">Event-Driven Workflow:</span> Selecting an outcome
            triggers automated actions including pipeline updates, notifications, and task
            creation. All actions are logged in the lead timeline.
          </p>
        </div>
      </Card>
    </div>
  );
}
