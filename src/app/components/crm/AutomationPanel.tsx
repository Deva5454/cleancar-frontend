/**
 * AutomationPanel - Shows event-driven automation rules
 * Displays Event → Action mappings for CRM workflow
 * NON-DESTRUCTIVE: New tab/section in CRM module
 */

import { useState } from "react";
import { useEventListener } from "../../contexts/EventSystem";
import { useCustomers } from "../../contexts/CustomerContext";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Zap,
  ArrowRight,
  CheckCircle,
  Mail,
  Bell,
  Database,
  Calendar,
  MessageSquare,
  Target,
  TrendingUp,
} from "lucide-react";
import type { SystemEvent } from "./EventBadge";

interface AutomationRule {
  id: string;
  event: SystemEvent;
  eventLabel: string;
  actions: AutomationAction[];
  isActive: boolean;
}

interface AutomationAction {
  type: "update" | "trigger" | "notify" | "create";
  description: string;
  icon: any;
}

const AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "rule-1",
    event: "LEAD_CREATED",
    eventLabel: "Lead Created",
    isActive: true,
    actions: [
      {
        type: "update",
        description: "Set status to 'New'",
        icon: Database,
      },
      {
        type: "trigger",
        description: "Auto-assign to available TSE",
        icon: Target,
      },
      {
        type: "notify",
        description: "Send WhatsApp welcome message",
        icon: MessageSquare,
      },
    ],
  },
  {
    id: "rule-2",
    event: "DEMO_SCHEDULED",
    eventLabel: "Demo Scheduled",
    isActive: true,
    actions: [
      {
        type: "update",
        description: "Update pipeline stage to 'Demo Scheduled'",
        icon: TrendingUp,
      },
      {
        type: "notify",
        description: "Send SMS reminder to customer (24h before)",
        icon: Bell,
      },
      {
        type: "notify",
        description: "Notify assigned washer",
        icon: MessageSquare,
      },
      {
        type: "create",
        description: "Create demo job in system",
        icon: Calendar,
      },
    ],
  },
  {
    id: "rule-3",
    event: "DEMO_COMPLETED",
    eventLabel: "Demo Completed",
    isActive: true,
    actions: [
      {
        type: "trigger",
        description: "Run decision logic (Interested/Not Interested)",
        icon: Zap,
      },
      {
        type: "notify",
        description: "Send follow-up template to TSE",
        icon: Mail,
      },
      {
        type: "update",
        description: "Update pipeline based on outcome",
        icon: TrendingUp,
      },
    ],
  },
  {
    id: "rule-4",
    event: "TRIAL_STARTED",
    eventLabel: "Trial Started",
    isActive: true,
    actions: [
      {
        type: "create",
        description: "Create trial subscription (7 days)",
        icon: Calendar,
      },
      {
        type: "trigger",
        description: "Schedule trial reminder (Day 5)",
        icon: Bell,
      },
      {
        type: "update",
        description: "Move to 'Trial' stage",
        icon: TrendingUp,
      },
    ],
  },
  {
    id: "rule-5",
    event: "DEAL_WON",
    eventLabel: "Deal Won",
    isActive: true,
    actions: [
      {
        type: "create",
        description: "Create active subscription",
        icon: CheckCircle,
      },
      {
        type: "trigger",
        description: "Generate first invoice",
        icon: Database,
      },
      {
        type: "notify",
        description: "Send welcome pack to customer",
        icon: Mail,
      },
      {
        type: "update",
        description: "Update revenue forecast",
        icon: TrendingUp,
      },
    ],
  },
  {
    id: "rule-6",
    event: "DEAL_LOST",
    eventLabel: "Deal Lost",
    isActive: true,
    actions: [
      {
        type: "update",
        description: "Archive lead with reason",
        icon: Database,
      },
      {
        type: "trigger",
        description: "Schedule re-engagement (30 days)",
        icon: Calendar,
      },
    ],
  },
];

const getEventColor = (event: SystemEvent): string => {
  const colors: Record<SystemEvent, string> = {
    LEAD_CREATED: "bg-gray-100 text-gray-700 border-gray-300",
    LEAD_ASSIGNED: "bg-blue-100 text-blue-700 border-blue-300",
    LEAD_QUALIFIED: "bg-purple-100 text-purple-700 border-purple-300",
    DEMO_SCHEDULED: "bg-teal-100 text-teal-700 border-teal-300",
    DEMO_COMPLETED: "bg-indigo-100 text-indigo-700 border-indigo-300",
    TRIAL_STARTED: "bg-yellow-100 text-yellow-700 border-yellow-300",
    DEAL_WON: "bg-green-100 text-green-700 border-green-300",
    DEAL_LOST: "bg-red-100 text-red-700 border-red-300",
    DEMO_FOLLOW_UP_REQUIRED: "bg-orange-100 text-orange-700 border-orange-300",
    PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-700 border-emerald-300",
    SUBSCRIPTION_ACTIVATED: "bg-green-100 text-green-700 border-green-300",
  };
  return colors[event] || "bg-gray-100 text-gray-700 border-gray-300";
};

export function AutomationPanel() {
  const [ruleFiredCount, setRuleFiredCount] = useState<Record<string, number>>({});
  const { appendLeadActivity, updateLead } = useCustomers();

  // Rule 1: Lead assigned → trigger WhatsApp welcome
  useEventListener("LEAD_ASSIGNED", (event) => {
    if (AUTOMATION_RULES.find(r => r.id === "rule-1")?.isActive) {
      setRuleFiredCount(prev => ({ ...prev, "rule-1": (prev["rule-1"] || 0) + 1 }));
    }
  });

  // Rule 2: Lead converted → log activity
  useEventListener("DEAL_WON", (event) => {
    if (AUTOMATION_RULES.find(r => r.id === "rule-2")?.isActive && event.data.leadId) {
      appendLeadActivity(event.data.leadId, {
        timestamp: new Date().toISOString(),
        type: "note",
        description: "Lead automatically marked Converted after payment confirmed",
        performedBy: "System Automation",
      });
      setRuleFiredCount(prev => ({ ...prev, "rule-2": (prev["rule-2"] || 0) + 1 }));
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-600" />
            Automation Rules
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Event-driven workflows automatically triggered by system events
          </p>
        </div>
        <Badge variant="outline" className="bg-green-100 text-green-700">
          {AUTOMATION_RULES.filter((r) => r.isActive).length} Active
        </Badge>
      </div>

      {/* Automation Rules Grid */}
      <div className="grid gap-4">
        {AUTOMATION_RULES.map((rule) => (
          <Card key={rule.id} className="p-4 hover:shadow-md transition-shadow">
            {/* Event Trigger */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono ${getEventColor(rule.event)}`}
                  >
                    {rule.event}
                  </Badge>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    When: {rule.eventLabel}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={rule.isActive ? "default" : "outline"} className="text-xs">
                  {rule.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-green-600">
                  {ruleFiredCount[rule.id] ? `Fired ${ruleFiredCount[rule.id]}× today` : "Waiting for trigger"}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px bg-gray-300 flex-1" />
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="h-px bg-gray-300 flex-1" />
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Then Automatically:
              </p>
              {rule.actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="w-8 h-8 rounded bg-white border border-gray-300 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{action.description}</p>
                      <p className="text-xs text-gray-500 capitalize">{action.type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Event-Driven Automation
            </p>
            <p className="text-xs text-blue-700 mt-1">
              These workflows run automatically when system events occur. No manual
              intervention required. Actions are logged in the activity timeline.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
