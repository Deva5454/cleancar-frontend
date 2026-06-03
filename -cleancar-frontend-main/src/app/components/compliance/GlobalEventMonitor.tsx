/**
 * Global Event Monitor
 *
 * Bottom-right floating widget showing real-time compliance alerts
 * Integrates with: Compliance errors, Policy changes, Tax alerts
 *
 * NON-DISRUPTIVE: Collapsible floating widget, doesn't block UI
 */

import { useState, useEffect } from "react";
import { Bell, X, ChevronDown, ChevronUp, AlertCircle, Info, TrendingUp } from "lucide-react";
import { getDetectedChanges, getComplianceHealthScore } from "../../services/compliance/aiComplianceBot";
import type { ComplianceChange } from "../../services/compliance/aiComplianceBot";
import { logger } from "../../services/logger";

export function GlobalEventMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [events, setEvents] = useState<ComplianceChange[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch pending changes
    const changes = getDetectedChanges("detected");
    setEvents(changes.slice(0, 5)); // Show max 5 events
    setUnreadCount(changes.length);
  }, []);

  const healthScore = getComplianceHealthScore();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all hover:scale-110 z-50"
      >
        <div className="relative">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Compliance Monitor</h3>
              <p className="text-xs text-blue-100">
                {unreadCount} active alert{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            >
              {isCollapsed ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Health Score */}
        {!isCollapsed && (
          <div className="mt-4 p-3 bg-white bg-opacity-10 rounded-lg backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-100">Compliance Health</div>
                <div className="text-2xl font-bold">{healthScore.score}%</div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  healthScore.grade === "A"
                    ? "bg-green-500 text-white"
                    : healthScore.grade === "B"
                    ? "bg-blue-500 text-white"
                    : healthScore.grade === "C"
                    ? "bg-yellow-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                Grade {healthScore.grade}
              </div>
            </div>
            <p className="text-xs text-blue-100 mt-2">{healthScore.recommendation}</p>
          </div>
        )}
      </div>

      {/* Events List */}
      {!isCollapsed && (
        <div className="max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No active compliance alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        event.severity === "critical"
                          ? "bg-red-100"
                          : event.severity === "high"
                          ? "bg-orange-100"
                          : event.severity === "medium"
                          ? "bg-yellow-100"
                          : "bg-blue-100"
                      }`}
                    >
                      {event.severity === "critical" || event.severity === "high" ? (
                        <AlertCircle
                          className={`w-4 h-4 ${
                            event.severity === "critical"
                              ? "text-red-600"
                              : "text-orange-600"
                          }`}
                        />
                      ) : (
                        <TrendingUp
                          className={`w-4 h-4 ${
                            event.severity === "medium"
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {event.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                            event.severity === "critical"
                              ? "bg-red-100 text-red-700"
                              : event.severity === "high"
                              ? "bg-orange-100 text-orange-700"
                              : event.severity === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {event.severity}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{event.affectedEmployees} employees</span>
                        <span>•</span>
                        <span>
                          Effective{" "}
                          {event.effectiveFrom.toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {event.impact.financialImpact !== 0 && (
                        <div
                          className={`text-xs font-medium mt-2 ${
                            event.impact.financialImpact > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {event.impact.financialImpact > 0 ? "+" : ""}₹
                          {Math.abs(event.impact.financialImpact).toLocaleString()} /month
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <button
            onClick={() => (logger.log("Compliance AI bot - feature coming soon"))}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Alerts
          </button>
        </div>
      )}
    </div>
  );
}
