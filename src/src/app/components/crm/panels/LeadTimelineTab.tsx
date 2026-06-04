import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import { Zap } from "lucide-react";
import {
  Phone,
  MessageSquare,
  Mail,
  MoveRight,
  Calendar,
  FileText,
  StickyNote,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { SystemEvent } from "../EventBadge";

interface LeadTimelineTabProps {
  lead: any;
}

export function LeadTimelineTab({ lead }: LeadTimelineTabProps) {
  const timelineEvents = [
    {
      id: 1,
      type: "call",
      title: "Call Logged - Connected",
      description: "Discussed plan features, customer interested in Premium plan. Duration: 5 min. Temperature set to Hot.",
      timestamp: "Mar 16, 2026 3:42 PM",
      actor: "Neha Singh (TSE)",
      icon: Phone,
      color: "blue",
      systemEvent: null as SystemEvent | null,
    },
    {
      id: 2,
      type: "message",
      title: "WhatsApp Message Sent",
      description: "Plan & Price template sent - CleanCar Premium for Sedan - ₹1,599/month",
      timestamp: "Mar 16, 2026 3:45 PM",
      actor: "Neha Singh (TSE)",
      icon: MessageSquare,
      color: "green",
      systemEvent: null,
    },
    {
      id: 3,
      type: "reply",
      title: "Customer Reply Received",
      description: "\"Thanks for the details. The pricing looks good. Can we schedule a demo?\"",
      timestamp: "Mar 16, 2026 4:12 PM",
      actor: lead.customerName,
      icon: Mail,
      color: "green",
      systemEvent: null,
    },
    {
      id: 4,
      type: "stage",
      title: "Stage Changed",
      description: "New → Qualified",
      timestamp: "Mar 16, 2026 4:15 PM",
      actor: "Neha Singh (TSE)",
      icon: MoveRight,
      color: "purple",
      systemEvent: "LEAD_QUALIFIED" as SystemEvent,
    },
    {
      id: 5,
      type: "demo",
      title: "Demo Scheduled",
      description: "Subscription Package Demo scheduled for Mar 19, 2026 - Morning slot. Supervisor: Suresh Yadav",
      timestamp: "Mar 16, 2026 4:20 PM",
      actor: "Neha Singh (TSE)",
      icon: Calendar,
      color: "teal",
      systemEvent: "DEMO_SCHEDULED" as SystemEvent,
    },
    {
      id: 6,
      type: "plan",
      title: "Plan & Price Sent",
      description: "CleanCar Premium - Sedan - ₹1,599/month sent via WhatsApp and Email",
      timestamp: "Mar 15, 2026 11:30 AM",
      actor: "Neha Singh (TSE)",
      icon: FileText,
      color: "orange",
      systemEvent: null,
    },
    {
      id: 7,
      type: "created",
      title: "Lead Created",
      description: "Lead assigned to Neha Singh from Website source",
      timestamp: "Mar 14, 2026 10:15 AM",
      actor: "System",
      icon: CheckCircle,
      color: "gray",
      systemEvent: "LEAD_CREATED" as SystemEvent,
    },
  ];

  const getEventColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      teal: "bg-teal-100 text-teal-600",
      orange: "bg-orange-100 text-orange-600",
      gray: "bg-gray-100 text-gray-600",
      red: "bg-red-100 text-red-600",
      yellow: "bg-yellow-100 text-yellow-600",
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="space-y-6">
      {/* Add Manual Note */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-yellow-600" />
          Add Manual Note
        </h4>
        <Textarea placeholder="Add a note to the timeline..." rows={3} className="mb-3" />
        <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
          Save Note
        </Button>
      </Card>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Input placeholder="Filter by event type..." className="max-w-xs" />
        <Button variant="outline" size="sm">
          All Events
        </Button>
        <Button variant="outline" size="sm">
          Calls Only
        </Button>
        <Button variant="outline" size="sm">
          Messages
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Showing {timelineEvents.length} of {timelineEvents.length} events
      </p>

      {/* Timeline */}
      <div className="space-y-4">
        {timelineEvents.map((event, index) => (
          <div key={event.id} className="flex gap-4">
            {/* Icon Column */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getEventColor(event.color)}`}>
                <event.icon className="w-5 h-5" />
              </div>
              {index < timelineEvents.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 mt-2" />
              )}
            </div>

            {/* Content Column */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">{event.title}</h4>
                  {event.systemEvent && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {event.systemEvent}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">{event.timestamp}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
              <p className="text-xs text-gray-500">by {event.actor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
