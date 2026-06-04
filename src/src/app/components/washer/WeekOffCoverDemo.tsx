/**
 * Week-Off & Cover Job Demo
 * Demonstrates all states and edge cases
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Play,
  RotateCcw,
  Calendar,
  Clock,
  Lock,
  Unlock,
  CheckCircle,
  Users,
} from "lucide-react";
import { weekOffCoverService } from "../../services/weekOffCoverService";
import type { WasherDayContext } from "../../types/weekOffCover";

export function WeekOffCoverDemo() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [dayContext, setDayContext] = useState<WasherDayContext | null>(null);

  const refresh = () => {
    const context = weekOffCoverService.getWasherDayContext("WASHER-001");
    setDayContext(context);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCheckIn = () => {
    weekOffCoverService.checkIn("WASHER-001");
    refresh();
  };

  const handleCompleteBaseUnit = () => {
    weekOffCoverService.completeBaseUnit();
    refresh();
  };

  const handleComplete5Units = () => {
    for (let i = 0; i < 5; i++) {
      weekOffCoverService.completeBaseUnit();
    }
    refresh();
  };

  const handleComplete10Units = () => {
    for (let i = 0; i < 10; i++) {
      weekOffCoverService.completeBaseUnit();
    }
    refresh();
  };

  const handleAssignCoverJobs = () => {
    weekOffCoverService.assignCoverJobs(
      "WASHER-002",
      "WASHER-001",
      ["JOB-C1", "JOB-C2", "JOB-C3"],
      "WEEK_OFF"
    );
    refresh();
  };

  const handleReset = () => {
    weekOffCoverService.reset();
    refresh();
  };

  useState(() => {
    refresh();
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Week-Off & Cover Job System - Demo
          </h1>
          <p className="text-gray-600 mt-2">
            System-driven redistribution with progressive disclosure
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* System State */}
            <Card className="border-2 border-blue-300">
              <CardHeader>
                <CardTitle className="text-sm">System State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayContext && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Day Status:</span>
                        <Badge className="bg-blue-600">{dayContext.dayStatus}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Checked In:</span>
                        <span className="font-semibold">
                          {dayContext.isCheckedIn ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Base Units:</span>
                        <span className="font-semibold">
                          {dayContext.baseUnitsCompleted} / {dayContext.baseQuota}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Base Complete:</span>
                        <span className="font-semibold">
                          {dayContext.isBaseComplete ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cover Jobs:</span>
                        <span className="font-semibold">
                          {dayContext.hasCoverJobs
                            ? `${dayContext.coverJobs.length} assigned`
                            : "None"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Can See Cover:</span>
                        <span className="font-semibold">
                          {dayContext.canSeeCoverDetails ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-2 border-green-300">
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleCheckIn} size="sm" className="w-full">
                  <Clock className="w-4 h-4 mr-2" />
                  Check In
                </Button>
                <Button onClick={handleCompleteBaseUnit} size="sm" className="w-full" variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  Complete 1 Unit
                </Button>
                <Button onClick={handleComplete5Units} size="sm" className="w-full" variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  Complete 5 Units
                </Button>
                <Button onClick={handleComplete10Units} size="sm" className="w-full" variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  Complete 10 Units
                </Button>
              </CardContent>
            </Card>

            {/* Cover Assignment */}
            <Card className="border-2 border-teal-300">
              <CardHeader>
                <CardTitle className="text-sm">Cover Job Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleAssignCoverJobs} size="sm" className="w-full bg-teal-600">
                  <Users className="w-4 h-4 mr-2" />
                  Assign 3 Cover Jobs
                </Button>
                <div className="mt-3 p-2 bg-teal-50 rounded text-xs">
                  <p className="font-semibold text-teal-900 mb-1">System-driven</p>
                  <p className="text-teal-800">
                    Washer cannot request or reject cover jobs
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Test Scenarios */}
            <Card className="border-2 border-indigo-300 bg-indigo-50">
              <CardHeader>
                <CardTitle className="text-sm text-indigo-900">Quick Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => {
                    handleReset();
                    setTimeout(() => handleCheckIn(), 100);
                  }}
                  size="sm"
                  className="w-full bg-indigo-600"
                  variant="outline"
                >
                  Scenario: Just Checked In
                </Button>
                <Button
                  onClick={() => {
                    handleReset();
                    setTimeout(() => {
                      handleCheckIn();
                      handleAssignCoverJobs();
                    }, 100);
                  }}
                  size="sm"
                  className="w-full bg-indigo-600"
                  variant="outline"
                >
                  Scenario: Cover Assigned (Locked)
                </Button>
                <Button
                  onClick={() => {
                    handleReset();
                    setTimeout(() => {
                      handleCheckIn();
                      handleAssignCoverJobs();
                      for (let i = 0; i < 25; i++) {
                        weekOffCoverService.completeBaseUnit();
                      }
                      refresh();
                    }, 100);
                  }}
                  size="sm"
                  className="w-full bg-indigo-600"
                  variant="outline"
                >
                  Scenario: Cover Unlocked
                </Button>
              </CardContent>
            </Card>

            {/* Reset */}
            <Card className="border-2 border-gray-300">
              <CardContent className="p-4">
                <Button onClick={handleReset} size="sm" className="w-full" variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset System
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Day Context Display */}
          <div className="lg:col-span-2 space-y-4">
            {/* Day Status */}
            {dayContext && (
              <Card className={`border-2 ${dayContext.dayInfo.color}`}>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="text-6xl">{dayContext.dayInfo.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{dayContext.dayInfo.message}</h3>
                      <p className="text-lg opacity-90">
                        Week-off: <strong>{dayContext.weekOffSchedule.assignedWeekOffDay}</strong>
                      </p>
                      <p className="text-sm mt-2 opacity-75">
                        Execution {dayContext.dayInfo.isExecutionAllowed ? "Allowed" : "Disabled"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cover Job Visibility State */}
            {dayContext && (
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Progressive Disclosure State
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const visibility = weekOffCoverService.getCoverJobVisibility("WASHER-001");
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">State:</span>
                          <Badge className="bg-purple-600">{visibility.state}</Badge>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                          <p className="text-sm text-purple-900">{visibility.message}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600 mb-1">Show Count</p>
                            <p className="text-lg font-bold">
                              {visibility.showCount ? "Yes" : "No"}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600 mb-1">Show Details</p>
                            <p className="text-lg font-bold">
                              {visibility.showDetails ? "Yes" : "No"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Cover Job Summary */}
            {dayContext?.hasCoverJobs && dayContext.coverSummary && (
              <Card className="border-2 border-teal-300 bg-teal-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-teal-900">
                    {dayContext.coverSummary.isLocked ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Unlock className="w-5 h-5" />
                    )}
                    Cover Job Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-white rounded border-2 border-teal-300">
                      <p className="text-sm text-gray-600 mb-1">Total Cover Units</p>
                      <p className="text-5xl font-bold text-teal-600">
                        +{dayContext.coverSummary.totalCoverUnits}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded">
                      <p className="text-sm font-semibold text-gray-900 mb-2">From Washers:</p>
                      <div className="flex gap-2 flex-wrap">
                        {dayContext.coverSummary.fromWashers.map((washer) => (
                          <Badge key={washer} variant="outline">
                            {washer}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-teal-100 rounded">
                      <p className="text-sm text-teal-900">
                        <strong>Status:</strong>{" "}
                        {dayContext.coverSummary.isLocked ? "Locked (Complete base first)" : "Unlocked"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cover Jobs (if unlocked) */}
            {dayContext?.canSeeCoverDetails && dayContext.coverJobs.length > 0 && (
              <Card className="border-2 border-green-300 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <CheckCircle className="w-5 h-5" />
                    Unlocked Cover Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayContext.coverJobs.map((job, index) => (
                      <div key={job.id} className="p-4 bg-white rounded border-2 border-green-300">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-green-600 text-white">Cover Job #{index + 1}</Badge>
                          <Badge variant="outline">{job.coverReason}</Badge>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{job.customerFirstName}</p>
                        <p className="text-sm text-gray-600">
                          From: <strong>{job.originalWasher}</strong>
                        </p>
                        <p className="text-sm text-gray-600">{job.area}</p>
                        <p className="text-xs text-gray-500 mt-2">{job.specialNotes}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {dayContext && (
              <Card className="border-2 border-amber-300">
                <CardHeader>
                  <CardTitle className="text-amber-900">Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const unread = weekOffCoverService.getUnreadNotifications("WASHER-001");
                    return unread.length > 0 ? (
                      <div className="space-y-2">
                        {unread.map((notif) => (
                          <div key={notif.id} className="p-3 bg-amber-50 border border-amber-200 rounded">
                            <p className="text-sm font-semibold text-amber-900">{notif.message}</p>
                            <p className="text-xs text-amber-700 mt-1">
                              {new Date(notif.assignedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Design Validation */}
        <Card className="mt-6 border-2 border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">✅ Design Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-green-900 mb-2">✅ Washer Understands:</p>
                <ul className="text-sm space-y-1 text-green-800">
                  <li>✓ "I have extra work today"</li>
                  <li>✓ "Finish my base first"</li>
                  <li>✓ "Then I get more jobs"</li>
                  <li>✓ "Cover jobs contribute to incentives"</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-900 mb-2">❌ Washer CANNOT:</p>
                <ul className="text-sm space-y-1 text-red-800">
                  <li>✗ Choose cover jobs</li>
                  <li>✗ See cover jobs before base complete</li>
                  <li>✗ See system algorithm</li>
                  <li>✗ Request or reject covers</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
