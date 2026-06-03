/**
 * Incentive Engine Demo Page
 * Demonstrates all edge cases, dynamic features, and state-driven UI
 */

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Play,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
} from "lucide-react";
import { incentiveEngineService } from "../../services/incentiveEngineService";
import { IncentiveTracker } from "./IncentiveTracker";

export function IncentiveEngineDemo() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((prev) => prev + 1);

  const handleCompleteUnit = () => {
    const result = incentiveEngineService.completeUnit(`JOB-${Date.now()}`);
    toast.info(result.message);
    refresh();
  };

  const handleCompleteMultiple = (count: number) => {
    for (let i = 0; i < count; i++) {
      incentiveEngineService.completeUnit(`JOB-${Date.now()}-${i}`);
    }
    refresh();
  };

  const handleAssignAddOn = () => {
    const addOn = incentiveEngineService.assignAddOn(
      "JOB-TEST",
      "INTERIOR_VACUUM",
      "Interior Vacuum",
      "TELECALLER",
      "Customer requested during booking"
    );
    const result = incentiveEngineService.completeAddOn(addOn);
    toast.info(result.message);
    refresh();
  };

  const handleSetLateCheckIn = () => {
    incentiveEngineService.setLateCheckIn(
      true,
      "Checked in 15 minutes late - incentives disabled for today"
    );
    toast.info("⚠️ Late check-in penalty applied. Incentives disabled.");
    refresh();
  };

  const handleSetWeekOff = () => {
    incentiveEngineService.setWeekOff(true);
    toast.info("📅 Week-off day set. No incentives allowed.");
    refresh();
  };

  const handleSetCoverDay = () => {
    incentiveEngineService.setCoverDay(true);
    toast.info("🔄 Cover day set. Incentives active after base completion.");
    refresh();
  };

  const handleReset = () => {
    incentiveEngineService.reset();
    toast.info("🔄 System reset. Starting fresh.");
    refresh();
  };

  const handleLoadConfig = () => {
    // Simulate loading config from backend
    incentiveEngineService.loadConfig({
      baseQuota: 25,
      maxDailyLimit: 33,
      incentivePerUnit: 50,
      monthlyBaseTarget: 550,
      avgWorkingDaysPerMonth: 26,
      timeBands: [
        {
          id: "BAND-1",
          name: "Morning Shift",
          startTime: "06:00",
          endTime: "12:00",
          isActive: true,
        },
        {
          id: "BAND-2",
          name: "Evening Shift",
          startTime: "16:00",
          endTime: "20:00",
          isActive: true,
        },
      ],
      addOnRates: {
        INTERIOR_VACUUM: 30,
        ENGINE_CLEANING: 50,
        UNDERBODY_WASH: 40,
      },
    });
    toast.success("✅ Configuration loaded from backend (simulated)");
    refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Incentive Engine - Full Demo</h1>
          <p className="text-gray-600 mt-2">
            Dynamic, config-driven, manipulation-proof incentive system with edge case handling
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Configuration */}
            <Card className="border-2 border-blue-300">
              <CardHeader>
                <CardTitle className="text-sm">System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleLoadConfig} size="sm" className="w-full bg-blue-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Load Config (API)
                </Button>
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <p className="font-semibold text-blue-900 mb-1">⚠️ NO Hard Coding</p>
                  <p className="text-blue-800">All values from backend API</p>
                </div>
              </CardContent>
            </Card>

            {/* Basic Actions */}
            <Card className="border-2 border-green-300">
              <CardHeader>
                <CardTitle className="text-sm">Complete Units</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleCompleteUnit} size="sm" className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Complete 1 Unit
                </Button>
                <Button onClick={() => handleCompleteMultiple(5)} size="sm" className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Complete 5 Units
                </Button>
                <Button onClick={() => handleCompleteMultiple(10)} size="sm" className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Complete 10 Units
                </Button>
              </CardContent>
            </Card>

            {/* Add-on Services */}
            <Card className="border-2 border-purple-300">
              <CardHeader>
                <CardTitle className="text-sm">Add-on Services</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleAssignAddOn} size="sm" className="w-full bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Assign & Complete Add-on
                </Button>
                <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                  <p className="font-semibold text-purple-900 mb-1">🚫 Washer Cannot Trigger</p>
                  <p className="text-purple-800">Only system/telecaller can assign</p>
                </div>
              </CardContent>
            </Card>

            {/* Edge Cases */}
            <Card className="border-2 border-amber-300">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Edge Cases
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleSetLateCheckIn} size="sm" className="w-full bg-red-600" variant="destructive">
                  <Clock className="w-4 h-4 mr-2" />
                  Late Check-in
                </Button>
                <Button onClick={handleSetWeekOff} size="sm" className="w-full bg-purple-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Set Week-off
                </Button>
                <Button onClick={handleSetCoverDay} size="sm" className="w-full bg-blue-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Set Cover Day
                </Button>
              </CardContent>
            </Card>

            {/* Testing Scenarios */}
            <Card className="border-2 border-indigo-300 bg-indigo-50">
              <CardHeader>
                <CardTitle className="text-sm text-indigo-900">Quick Test Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => {
                    handleReset();
                    setTimeout(() => handleCompleteMultiple(20), 100);
                  }}
                  size="sm"
                  className="w-full bg-indigo-600"
                  variant="outline"
                >
                  Scenario: Below Base (20/25)
                </Button>
                <Button
                  onClick={() => {
                    handleReset();
                    setTimeout(() => handleCompleteMultiple(25), 100);
                  }}
                  size="sm"
                  className="w-full bg-indigo-600"
                  variant="outline"
                >
                  Scenario: Base Complete (25/25)
                </Button>
                <Button
                  onClick={() => {
                    handleReset();
                    setTimeout(() => handleCompleteMultiple(30), 100);
                  }}
                  size="sm"
                  className="w-full bg-indigo-600"
                  variant="outline"
                >
                  Scenario: Above Base (30)
                </Button>
                <Button
                  onClick={() => {
                    handleReset();
                    setTimeout(() => {
                      handleSetLateCheckIn();
                      setTimeout(() => handleCompleteMultiple(10), 100);
                    }, 100);
                  }}
                  size="sm"
                  className="w-full bg-indigo-600"
                  variant="outline"
                >
                  Scenario: Late + Work
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

          {/* Right Column - Incentive Tracker (2/3 width) */}
          <div className="lg:col-span-2">
            <IncentiveTracker key={refreshKey} />
          </div>
        </div>

        {/* Design Principles */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <Card className="border-2 border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-sm text-red-900">❌ What Washer CANNOT Do</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p className="text-red-800">• Influence earnings</p>
              <p className="text-red-800">• Trigger add-ons</p>
              <p className="text-red-800">• See calculation formulas</p>
              <p className="text-red-800">• See per-unit rates</p>
              <p className="text-red-800">• Manipulate time bands</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-sm text-green-900">✅ What Washer CAN See</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p className="text-green-800">• Units completed</p>
              <p className="text-green-800">• Total earnings (₹ amount only)</p>
              <p className="text-green-800">• Eligibility status</p>
              <p className="text-green-800">• Progress toward base</p>
              <p className="text-green-800">• Time band status</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm text-blue-900">🎯 Core Understanding</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p className="text-blue-800 font-semibold">• Complete 25 → start earning</p>
              <p className="text-blue-800 font-semibold">• More work → more money</p>
              <p className="text-blue-800 font-semibold">• Time matters</p>
              <p className="text-blue-800">System handles rest automatically</p>
            </CardContent>
          </Card>
        </div>

        {/* Validation Checklist */}
        <Card className="mt-6 border-2 border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">✅ Design Validation Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-green-900 mb-2">✅ Design is CORRECT if:</p>
                <ul className="text-sm space-y-1 text-green-800">
                  <li>✓ Washer understands "Complete 25 → start earning"</li>
                  <li>✓ Washer understands "More work → more money"</li>
                  <li>✓ Washer understands "Time matters"</li>
                  <li>✓ No formulas visible to washer</li>
                  <li>✓ No per-unit rates shown</li>
                  <li>✓ Add-ons are view-only</li>
                  <li>✓ All values dynamic (from config)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-900 mb-2">❌ Design is WRONG if:</p>
                <ul className="text-sm space-y-1 text-red-800">
                  <li>✗ Washer can influence earnings</li>
                  <li>✗ User sees formulas or calculation logic</li>
                  <li>✗ Hardcoded values visible (25, 50, etc.)</li>
                  <li>✗ Add-ons are selectable by washer</li>
                  <li>✗ Washer can trigger add-ons</li>
                  <li>✗ Per-unit rates displayed</li>
                  <li>✗ Complex math or financial jargon</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
