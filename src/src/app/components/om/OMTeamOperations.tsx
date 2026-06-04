/**
 * OPERATIONS MANAGER: TEAM OPERATIONS VIEW
 * Washer-level performance tracking with unit discipline enforcement
 * Color-coded alerts: <25 (underperforming) | 25-33 (normal) | >33 (violation)
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Users, TrendingUp, AlertTriangle, CheckCircle, XCircle, Activity } from "lucide-react";
import { useState } from "react";
import { UNIT_CONTROL } from "../../constants/operationsManager.constants";
import type { WasherOperationalView } from "../../types/operationsManager.types";

export interface OMTeamOperationsProps {
  teams: { id: string; name: string; supervisor: string }[];
  washers: WasherOperationalView[];
  onReassignCover: (washerId: string) => void;
  onViewWasherDetail: (washerId: string) => void;
  onEscalate: (washerId: string) => void;
}

export function OMTeamOperations({
  teams,
  washers,
  onReassignCover,
  onViewWasherDetail,
  onEscalate,
}: OMTeamOperationsProps) {
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || "");

  const teamWashers = washers.filter(w => 
    w.team === teams.find(t => t.id === selectedTeam)?.name
  );

  // Unit Control System Logic
  const getUnitColorCoding = (units: number) => {
    if (units < UNIT_CONTROL.MIN_TARGET) return {
      bg: "bg-red-100",
      border: "border-red-300",
      text: "text-red-700",
      badge: "bg-red-600 text-white",
      label: "🔴 Underperforming",
    };
    if (units > UNIT_CONTROL.MAX_CAPACITY) return {
      bg: "bg-red-100",
      border: "border-red-400",
      text: "text-red-800",
      badge: "bg-red-700 text-white",
      label: "🔴 Violation",
    };
    return {
      bg: "bg-green-50",
      border: "border-green-300",
      text: "text-green-700",
      badge: "bg-green-600 text-white",
      label: "🟢 Normal",
    };
  };

  const getCoverColorCoding = (cover: number) => {
    if (cover === 0) return { bg: "bg-gray-100", text: "text-gray-700", label: "No Cover" };
    if (cover <= UNIT_CONTROL.DEFAULT_COVER_LIMIT) return { bg: "bg-green-100", text: "text-green-700", label: "✓ Default" };
    if (cover <= UNIT_CONTROL.MAX_COVER_WITH_OM_OVERRIDE) return { bg: "bg-yellow-100", text: "text-yellow-700", label: "⚠️ OM Override" };
    return { bg: "bg-red-100", text: "text-red-700", label: "🔒 Requires City Manager" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-2">Team Operations</h1>
          <p className="text-sm text-indigo-200">Execution Layer Deep Dive</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* TEAM TABS */}
        <Tabs value={selectedTeam} onValueChange={setSelectedTeam}>
          <TabsList className="mb-6 grid grid-cols-6 w-full">
            {teams.map(team => (
              <TabsTrigger key={team.id} value={team.id} className="text-sm">
                {team.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {teams.map(team => (
            <TabsContent key={team.id} value={team.id}>
              {/* TEAM SUMMARY */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
                      <p className="text-sm text-gray-600">Supervisor: {team.supervisor}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Export</Button>
                      <Button size="sm" variant="outline">Reassign</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Team Status</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {teamWashers.filter(w => w.status === "PRESENT").length} / {teamWashers.length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Present Today</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Units Today</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {teamWashers.reduce((sum, w) => sum + w.units.done, 0).toFixed(1)} / {teamWashers.length * 25}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((teamWashers.reduce((sum, w) => sum + w.units.done, 0) / (teamWashers.length * 25)) * 100).toFixed(1)}% Complete
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Underperforming</p>
                      <p className="text-2xl font-bold text-yellow-900">{teamWashers.filter(w => w.units.done < 25).length}</p>
                      <p className="text-xs text-gray-500 mt-1">&lt;25 units</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Overloaded</p>
                      <p className="text-2xl font-bold text-red-900">{teamWashers.filter(w => w.units.done > 33).length}</p>
                      <p className="text-xs text-gray-500 mt-1">&gt;33 units</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* WASHER LIST */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Washer Performance</h3>
                  
                  <div className="space-y-3">
                    {teamWashers.map((washer) => {
                      const statusConfig = getStatusConfig(washer.status);
                      const performanceConfig = getPerformanceConfig(washer.performance);
                      const unitsProgress = (washer.units.done / washer.units.target) * 100;

                      return (
                        <div
                          key={washer.id}
                          className={`p-4 rounded-lg border-2 ${
                            washer.performance === "CRITICAL" || washer.performance === "UNDERPERFORMING"
                              ? "bg-yellow-50 border-yellow-300"
                              : washer.units.done > 33
                              ? "bg-red-50 border-red-300"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Washer Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-gray-900">{washer.name}</h4>
                                <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
                                  {statusConfig.label}
                                </Badge>
                                <Badge className={`text-xs ${performanceConfig.color}`}>
                                  {performanceConfig.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mb-3">
                                {washer.id} • Check-in:{" "}
                                {washer.checkInTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "N/A"}
                              </p>

                              {/* Units Progress Bar */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-semibold text-gray-700">Units Today</span>
                                  <span className="text-sm font-bold text-gray-900">
                                    {washer.units.done} / {washer.units.target}
                                  </span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                                  <div
                                    className={`h-3 rounded-full ${
                                      unitsProgress >= 100
                                        ? "bg-green-500"
                                        : unitsProgress >= 80
                                        ? "bg-blue-500"
                                        : unitsProgress >= 60
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${Math.min(100, unitsProgress)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Category Breakdown */}
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-500">4W</p>
                                  <p className="font-bold text-gray-900">{washer.units.fourW}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">2W</p>
                                  <p className="font-bold text-gray-900">{washer.units.twoW}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Add-on</p>
                                  <p className="font-bold text-gray-900">{washer.units.addOn}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Cover</p>
                                  <p className={`font-bold ${washer.units.cover > 0 ? "text-orange-600" : "text-gray-900"}`}>
                                    {washer.units.cover > 0 ? `+${washer.units.cover}` : washer.units.cover}
                                  </p>
                                </div>
                              </div>

                              {/* Active Wash */}
                              {washer.activeWash && (
                                <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                                  <div className="flex items-center gap-2 text-xs">
                                    <Activity className="h-4 w-4 text-blue-600" />
                                    <span className="font-semibold text-blue-900">Active Wash:</span>
                                    <span className="text-blue-700">{washer.activeWash.carNumber}</span>
                                    <span className="text-gray-600">
                                      • Started {Math.floor((Date.now() - washer.activeWash.startTime.getTime()) / 60000)} mins ago
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onViewWasherDetail(washer.id)}
                              >
                                View
                              </Button>
                              {washer.units.cover > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                  onClick={() => onReassignCover(washer.id)}
                                >
                                  Reassign
                                </Button>
                              )}
                              {(washer.performance === "CRITICAL" || washer.performance === "UNDERPERFORMING") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => onEscalate(washer.id)}
                                >
                                  Escalate
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

// Helper functions
function getStatusConfig(status: WasherOperationalView["status"]) {
  switch (status) {
    case "PRESENT":
      return { color: "bg-green-100 text-green-700 border-green-300", label: "Present" };
    case "LATE":
      return { color: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "Late" };
    case "ABSENT":
      return { color: "bg-red-100 text-red-700 border-red-300", label: "Absent" };
    case "LEAVE":
      return { color: "bg-blue-100 text-blue-700 border-blue-300", label: "Leave" };
  }
}

function getPerformanceConfig(performance: WasherOperationalView["performance"]) {
  switch (performance) {
    case "EXCELLENT":
      return { color: "bg-green-600 text-white", label: "Excellent" };
    case "ON_TRACK":
      return { color: "bg-blue-600 text-white", label: "On Track" };
    case "UNDERPERFORMING":
      return { color: "bg-yellow-600 text-white", label: "Below Target" };
    case "CRITICAL":
      return { color: "bg-red-600 text-white", label: "Critical" };
  }
}