/**
 * EventMonitor - Floating event debug panel (DEV ONLY)
 * Shows last events triggered in the system + live stream
 * NON-DESTRUCTIVE: Floating panel in bottom-right corner
 */

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronDown, ChevronUp, Zap, CheckCircle, Clock, XCircle, Users } from "lucide-react";
import type { SystemEvent } from "./EventBadge";
import { useEvents } from "../../contexts/EventSystem";

interface EventLog {
  id: string;
  event: SystemEvent;
  timestamp: Date;
  status: "triggered" | "processing" | "completed" | "failed";
  metadata?: Record<string, any>;
}

// Global event log (in-memory for demo)
const eventLogs: EventLog[] = [
  {
    id: "1",
    event: "DEMO_COMPLETED",
    timestamp: new Date(Date.now() - 2000),
    status: "completed",
    metadata: { demoId: "DEMO-001", washer: "Ravi Kumar" },
  },
  {
    id: "2",
    event: "LEAD_QUALIFIED",
    timestamp: new Date(Date.now() - 5000),
    status: "completed",
    metadata: { leadId: "LEAD-456", tse: "Neha Singh" },
  },
  {
    id: "3",
    event: "DEMO_SCHEDULED",
    timestamp: new Date(Date.now() - 10000),
    status: "completed",
    metadata: { demoId: "DEMO-002", date: "Mar 19, 2026" },
  },
];

export function EventMonitor() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [events, setEvents] = useState<EventLog[]>(eventLogs);
  const { getEventHistory } = useEvents();

  // Poll for real events from EventSystem
  useEffect(() => {
    const interval = setInterval(() => {
      const history = getEventHistory(undefined, 20);
      if (history.length > 0) {
        const mapped = history.map((e, idx) => ({
          id: `${idx}-${e.timestamp}`,
          event: e.type as SystemEvent,
          timestamp: new Date(e.timestamp),
          status: "completed" as const,
          metadata: e.data,
        }));
        setEvents(mapped);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getEventHistory]);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const getStatusIcon = (status: EventLog["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case "processing":
        return <Clock className="w-3 h-3 text-yellow-600" />;
      case "failed":
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return <Zap className="w-3 h-3 text-blue-600" />;
    }
  };

  const getStatusColor = (status: EventLog["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "processing":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const formatTimestamp = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="shadow-lg border-2 border-purple-200">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="font-semibold text-sm text-purple-900">Event Monitor</span>
            <Badge variant="outline" className="text-xs bg-white">
              {events.length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Last {events.length} events</p>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Live
              </Badge>
            </div>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-500">No events yet</p>
                <p className="text-xs text-gray-400 mt-1">Events will appear here as they occur...</p>
              </div>
            ) : (
              events.map((event) => (
              <div
                key={event.id}
                className="p-2 bg-gray-50 rounded border border-gray-200 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(event.status)}
                    <span className="text-xs font-mono font-semibold text-gray-900 truncate">
                      {event.event}
                    </span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(event.status)}`}>
                    {event.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 ml-5">
                  {formatTimestamp(event.timestamp)}
                </p>
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-1 ml-5 text-xs text-gray-600 font-mono bg-white p-1 rounded">
                    {Object.entries(event.metadata)
                      .slice(0, 2)
                      .map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-500">{key}:</span> {String(value).slice(0, 30)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )))}
          </div>
        )}
      </Card>
    </div>
  );
}
