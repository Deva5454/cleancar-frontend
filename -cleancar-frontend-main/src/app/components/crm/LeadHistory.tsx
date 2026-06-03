import { useState } from "react";
import { useCustomers } from "../../contexts/CustomerContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Phone,
  MessageSquare,
  Calendar,
  User,
  Edit,
  ArrowRight,
  Clock,
  CheckCircle,
  Mail,
  FileText,
  AlertCircle,
  TrendingUp,
  UserPlus,
  Star,
  Tag,
  MapPin,
} from "lucide-react";

type HistoryEventType =
  | "created"
  | "stage_change"
  | "status_update"
  | "call_made"
  | "whatsapp_sent"
  | "email_sent"
  | "followup_scheduled"
  | "demo_scheduled"
  | "demo_completed"
  | "note_added"
  | "priority_changed"
  | "assigned"
  | "field_updated"
  | "proposal_sent"
  | "converted";

type HistoryEvent = {
  id: string;
  leadId: string;
  eventType: HistoryEventType;
  timestamp: string;
  performedBy: string;
  performedByRole: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
  duration?: number; // for calls
  outcome?: string;
  systemGenerated?: boolean;
};

const mockHistory: HistoryEvent = []; // ✅ No mock data

const eventConfig: Record<
  HistoryEventType,
  { icon: any; color: string; label: string }
> = {
  created: {
    icon: Star,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Lead Created",
  },
  stage_change: {
    icon: ArrowRight,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    label: "Stage Changed",
  },
  status_update: {
    icon: Edit,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    label: "Status Updated",
  },
  call_made: {
    icon: Phone,
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Call Made",
  },
  whatsapp_sent: {
    icon: MessageSquare,
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    label: "WhatsApp Sent",
  },
  email_sent: {
    icon: Mail,
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    label: "Email Sent",
  },
  followup_scheduled: {
    icon: Calendar,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    label: "Follow-up Scheduled",
  },
  demo_scheduled: {
    icon: CheckCircle,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Demo Scheduled",
  },
  demo_completed: {
    icon: CheckCircle,
    color: "bg-teal-100 text-teal-800 border-teal-200",
    label: "Demo Completed",
  },
  note_added: {
    icon: FileText,
    color: "bg-slate-100 text-slate-800 border-slate-200",
    label: "Note Added",
  },
  priority_changed: {
    icon: AlertCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Priority Changed",
  },
  assigned: {
    icon: UserPlus,
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    label: "Lead Assigned",
  },
  field_updated: {
    icon: Edit,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    label: "Field Updated",
  },
  proposal_sent: {
    icon: TrendingUp,
    color: "bg-violet-100 text-violet-800 border-violet-200",
    label: "Proposal Sent",
  },
  converted: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Converted to Customer",
  },
};

type LeadHistoryProps = {
  leadId: string;
  leadName: string;
  onClose?: () => void;
};

export function LeadHistory({ leadId, leadName, onClose }: LeadHistoryProps) {
  const { leads } = useCustomers();
  const lead = leads.find(l => l.leadId === leadId);
  const history = (lead?.timeline || []).map(t => ({
    id: t.id, leadId,
    eventType: t.type as any,
    timestamp: t.timestamp,
    performedBy: t.performedBy,
    performedByRole: "TSE",
    description: t.description,
    systemGenerated: false,
    metadata: t.metadata,
    outcome: t.outcome,
    details: t.nextAction,
  }));
  const [filter, setFilter] = useState<"all" | "calls" | "stages" | "system">(
    "all"
  );

  const filteredHistory = history.filter((event) => {
    if (filter === "all") return true;
    if (filter === "calls")
      return ["call_made", "whatsapp_sent", "email_sent"].includes(
        event.eventType
      );
    if (filter === "stages")
      return ["stage_change", "status_update"].includes(event.eventType);
    if (filter === "system") return event.systemGenerated === true;
    return true;
  });

  // Sort by timestamp descending (newest first, oldest last)
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    // Parse timestamps and compare (assuming format "YYYY-MM-DD HH:MM AM/PM")
    const dateA = new Date(a.timestamp.replace(/(\d{4}-\d{2}-\d{2})/, '$1'));
    const dateB = new Date(b.timestamp.replace(/(\d{4}-\d{2}-\d{2})/, '$1'));
    return dateB.getTime() - dateA.getTime();
  });

  const stats = {
    totalEvents: history.length,
    calls: history.filter((h) => h.eventType === "call_made").length,
    stageChanges: history.filter((h) => h.eventType === "stage_change").length,
    systemEvents: history.filter((h) => h.systemGenerated).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Lead History</h3>
          <p className="text-sm text-gray-500 mt-1">
            Complete activity timeline for {leadName} ({leadId})
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            filter === "all" ? "border-blue-500 bg-blue-50" : ""
          }`}
          onClick={() => setFilter("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalEvents}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            filter === "calls" ? "border-green-500 bg-green-50" : ""
          }`}
          onClick={() => setFilter("calls")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Communications</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.calls}
                </p>
              </div>
              <Phone className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            filter === "stages" ? "border-purple-500 bg-purple-50" : ""
          }`}
          onClick={() => setFilter("stages")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Stage Changes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.stageChanges}
                </p>
              </div>
              <ArrowRight className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            filter === "system" ? "border-orange-500 bg-orange-50" : ""
          }`}
          onClick={() => setFilter("system")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">System Events</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.systemEvents}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Activity Timeline
              {filter !== "all" && (
                <Badge variant="outline" className="ml-2">
                  {filter === "calls" && "Communications Only"}
                  {filter === "stages" && "Stage Changes Only"}
                  {filter === "system" && "System Events Only"}
                </Badge>
              )}
            </span>
            <span className="text-sm text-gray-500 font-normal">
              {sortedHistory.length} event
              {sortedHistory.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Events */}
            <div className="space-y-6">
              {sortedHistory.map((event, index) => {
                const config = eventConfig[event.eventType];
                const Icon = config.icon;
                const isLast = index === sortedHistory.length - 1;

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 p-2.5 rounded-full border-2 ${config.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-100 hover:border-gray-200 transition-colors">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={config.color}>
                                {config.label}
                              </Badge>
                              {event.systemGenerated && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-gray-500"
                                >
                                  Auto
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-gray-900 mt-1">
                              {event.description}
                            </h4>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {event.timestamp.split(" ")[1]}{" "}
                              {event.timestamp.split(" ")[2]}
                            </div>
                            <div className="text-xs text-gray-500">
                              {event.timestamp.split(" ")[0]}
                            </div>
                          </div>
                        </div>

                        {/* Old/New Values for Changes */}
                        {event.oldValue && event.newValue && (
                          <div className="flex items-center gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                            <Badge variant="outline" className="bg-red-50">
                              {event.oldValue}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <Badge variant="outline" className="bg-green-50">
                              {event.newValue}
                            </Badge>
                          </div>
                        )}

                        {/* Call Duration & Outcome */}
                        {event.duration && (
                          <div className="mb-2 p-2 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs font-medium text-green-800">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Duration: {event.duration} minutes
                            </p>
                          </div>
                        )}

                        {event.outcome && (
                          <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs font-medium text-blue-700 mb-1">
                              Outcome:
                            </p>
                            <p className="text-sm text-blue-900">
                              {event.outcome}
                            </p>
                          </div>
                        )}

                        {/* Details */}
                        {event.details && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              {event.details}
                            </p>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span className="font-medium">
                              {event.performedBy}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span>{event.performedByRole}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {event.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredHistory.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No history events
                </h3>
                <p className="text-sm text-gray-500">
                  No events match the selected filter.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Options</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Export as PDF
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Export as CSV
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Email Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}