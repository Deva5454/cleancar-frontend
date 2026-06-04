/**
 * Incentive Tracker Component - FULLY REDESIGNED
 *
 * CRITICAL DESIGN PRINCIPLES:
 * 1. NO HARD CODING - All values dynamic, config-driven, API-based
 * 2. WASHER = VIEW ONLY - Cannot influence earnings, trigger add-ons, or see formulas
 * 3. STATE-DRIVEN UI - Changes based on progress/eligibility/time/limits
 *
 * Components:
 * 1. Base Progress
 * 2. Eligibility Status
 * 3. Time Band Status
 * 4. Incentive Units Breakdown
 * 5. Earnings Display
 * 6. Add-on Display (Passive)
 * 7. Monthly Potential
 * 8. Max Limit Indicator
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { incentiveEngineService } from "../../services/incentiveEngineService";
import type { IncentiveTrackerState, EarningsBreakdown } from "../../types/incentiveEngine";

export function IncentiveTracker() {
  const [trackerState, setTrackerState] = useState<IncentiveTrackerState | null>(null);
  const [breakdown, setBreakdown] = useState<EarningsBreakdown | null>(null);
  const [animateUnlock, setAnimateUnlock] = useState(false);
  const [animateEarning, setAnimateEarning] = useState(false);

  useEffect(() => {
    const updateState = () => {
      const state = incentiveEngineService.getTrackerState();
      const earningsBreakdown = incentiveEngineService.getEarningsBreakdown();

      // Handle animations
      if (state.shouldAnimateUnlock) {
        setAnimateUnlock(true);
        setTimeout(() => setAnimateUnlock(false), 2000);
      }

      if (state.shouldAnimateEarning) {
        setAnimateEarning(true);
        setTimeout(() => setAnimateEarning(false), 1000);
      }

      setTrackerState(state);
      setBreakdown(earningsBreakdown);
    };

    updateState();
    const interval = setInterval(updateState, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!trackerState || !breakdown) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading incentive data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ====== COMPONENT 1: BASE PROGRESS ====== */}
      <Card
        className={`border-2 transition-all duration-500 ${
          trackerState.progress.isBaseComplete
            ? "border-green-400 bg-green-50 shadow-lg"
            : "border-blue-300 bg-blue-50"
        } ${animateUnlock ? "animate-pulse" : ""}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span>Units Completed vs Target</span>
            </div>
            <Badge className={trackerState.progress.isBaseComplete ? "bg-green-600" : "bg-blue-600"}>
              {trackerState.progress.baseUnitsCompleted}/{trackerState.config.baseQuota}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className={`h-8 rounded-full transition-all duration-700 flex items-center justify-center text-white text-sm font-bold ${
                  trackerState.progress.isBaseComplete ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-blue-500 to-blue-600"
                }`}
                style={{ width: `${trackerState.progressBarPercent}%` }}
              >
                {trackerState.progressBarPercent > 15 && `${Math.round(trackerState.progressBarPercent)}%`}
              </div>
            </div>
          </div>

          {/* Message with Icon */}
          <div
            className={`text-center font-bold text-lg flex items-center justify-center gap-2 ${
              trackerState.progress.isBaseComplete ? "text-green-900" : "text-blue-900"
            }`}
          >
            {trackerState.progress.isBaseComplete ? (
              <>
                <Sparkles className="w-5 h-5 text-green-600" />
                {trackerState.progressMessage}
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-blue-600" />
                {trackerState.progressMessage}
              </>
            )}
          </div>

          {/* Units Remaining (Before Base Complete) */}
          {!trackerState.progress.isBaseComplete && (
            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300 shadow-sm">
              <p className="text-xs text-gray-600 text-center mb-1 uppercase tracking-wide">
                Units Remaining
              </p>
              <p className="text-4xl font-bold text-center text-blue-600">
                {trackerState.config.baseQuota - trackerState.progress.baseUnitsCompleted}
              </p>
              <p className="text-xs text-gray-500 text-center mt-2">
                Complete base target to unlock incentives
              </p>
            </div>
          )}

          {/* Unlocked Message (After Base Complete) */}
          {trackerState.progress.isBaseComplete && (
            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
              <p className="text-sm text-green-900 text-center font-semibold">
                🎉 Incentives unlocked! Keep going to earn more.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== COMPONENT 2: ELIGIBILITY STATUS ====== */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Eligibility Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div
                className={`w-14 h-14 rounded-full ${trackerState.eligibilityBadge.color} flex items-center justify-center text-white text-3xl shadow-lg`}
              >
                {trackerState.eligibilityBadge.icon}
              </div>
              <div>
                <p className="font-bold text-xl">{trackerState.eligibilityBadge.text}</p>
                {trackerState.progress.currentTimeBand && (
                  <p className="text-sm text-gray-600">{trackerState.progress.currentTimeBand.name}</p>
                )}
              </div>
            </div>
            <Badge className={`${trackerState.eligibilityBadge.color} text-white`}>
              {trackerState.progress.eligibilityStatus}
            </Badge>
          </div>

          {/* EDGE CASE 1: BELOW BASE BUT ADD-ONS DONE */}
          {trackerState.displayMessages.belowBase && (
            <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900 font-medium">{trackerState.displayMessages.belowBase}</p>
            </div>
          )}

          {/* EDGE CASE 2: ABOVE BASE BUT OUTSIDE BAND */}
          {trackerState.displayMessages.outsideBand && (
            <div className="mt-3 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg flex items-start gap-2">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 font-medium">{trackerState.displayMessages.outsideBand}</p>
            </div>
          )}

          {/* EDGE CASE 3: WEEK-OFF DAY */}
          {trackerState.displayMessages.weekOff && (
            <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-200 rounded-lg flex items-start gap-2">
              <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-purple-900">Week-off Day</p>
                <p className="text-sm text-purple-800">{trackerState.displayMessages.weekOff}</p>
              </div>
            </div>
          )}

          {/* EDGE CASE 4: COVER DAY */}
          {trackerState.displayMessages.coverDay && (
            <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-900">Cover Day</p>
                <p className="text-sm text-blue-800">{trackerState.displayMessages.coverDay}</p>
              </div>
            </div>
          )}

          {/* EDGE CASE 5: LATE CHECK-IN PENALTY */}
          {trackerState.displayMessages.latePenalty && (
            <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">Incentives Disabled</p>
                <p className="text-sm text-red-800">{trackerState.displayMessages.latePenalty}</p>
              </div>
            </div>
          )}

          {/* Eligible Message */}
          {trackerState.displayMessages.eligible && !trackerState.displayMessages.outsideBand && (
            <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-900 font-medium">{trackerState.displayMessages.eligible}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== COMPONENT 3: TIME BAND STATUS ====== */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div
                className={`w-4 h-4 rounded-full ${trackerState.timeBandIndicator.color} animate-pulse`}
              ></div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{trackerState.timeBandIndicator.message}</p>
                {trackerState.progress.currentTimeBand && (
                  <p className="text-xs text-gray-600">
                    {trackerState.progress.currentTimeBand.name} ({trackerState.progress.currentTimeBand.startTime} -{" "}
                    {trackerState.progress.currentTimeBand.endTime})
                  </p>
                )}
              </div>
            </div>
            <Badge
              className={
                trackerState.timeBandIndicator.status === "ACTIVE" ? "bg-green-600" : "bg-gray-500"
              }
            >
              {trackerState.timeBandIndicator.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ====== COMPONENT 4: INCENTIVE UNITS BREAKDOWN ====== */}
      {trackerState.progress.isBaseComplete && trackerState.progress.incentiveUnitsCompleted > 0 && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Target className="w-5 h-5" />
              Incentive Units Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-lg border-2 border-green-300 text-center">
                <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">In Band (Earning)</p>
                <p className="text-3xl font-bold text-green-600">{trackerState.progress.incentiveUnitsInBand}</p>
                <p className="text-xs text-green-700 mt-1">Counted in earnings</p>
              </div>

              <div className="p-4 bg-white rounded-lg border-2 border-amber-300 text-center">
                <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Out of Band</p>
                <p className="text-3xl font-bold text-amber-600">
                  {trackerState.progress.incentiveUnitsOutOfBand}
                </p>
                <p className="text-xs text-amber-700 mt-1">NOT counted in earnings</p>
              </div>
            </div>

            {/* Important Note */}
            {trackerState.progress.unitsOutsideBand > 0 && (
              <div className="mt-3 p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-900 text-center">
                  ⚠️ {trackerState.progress.unitsOutsideBand} unit(s) completed outside earning window. These
                  units count toward total but do not earn incentives.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ====== COMPONENT 5: EARNINGS DISPLAY (VIEW ONLY) ====== */}
      <Card className={`border-2 border-green-300 bg-green-50 ${animateEarning ? "animate-pulse" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <DollarSign className="w-5 h-5" />
            Your Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Today's Earnings */}
          <div className="mb-4 p-5 bg-white rounded-lg border-2 border-green-400 shadow-md text-center">
            <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Today's Earnings</p>
            <p className="text-5xl font-bold text-green-600">₹{trackerState.progress.todayEarnings.toLocaleString()}</p>
          </div>

          {/* Monthly Earnings */}
          <div className="mb-4 p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Monthly Earnings (So Far)</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{trackerState.progress.monthlyEarnings.toLocaleString()}
            </p>
          </div>

          {/* Units Breakdown (Simplified - NO rates shown) */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Base</p>
              <p className="text-xl font-bold text-blue-600">{breakdown.breakdown.baseUnits}</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Incentive</p>
              <p className="text-xl font-bold text-green-600">{breakdown.breakdown.incentiveUnits}</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Add-ons</p>
              <p className="text-xl font-bold text-purple-600">{breakdown.breakdown.addOnServices}</p>
            </div>
          </div>

          {/* Earnings Breakdown (Show amounts, NOT rates or formulas) */}
          {(trackerState.progress.incentiveEarnings > 0 || trackerState.progress.addOnEarnings > 0) && (
            <div className="space-y-2 mb-4">
              {trackerState.progress.incentiveEarnings > 0 && (
                <div className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="text-sm text-gray-700">Incentive Earnings</span>
                  <span className="text-sm font-bold text-green-600">
                    ₹{trackerState.progress.incentiveEarnings.toLocaleString()}
                  </span>
                </div>
              )}

              {trackerState.progress.addOnEarnings > 0 && (
                <div className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="text-sm text-gray-700">Add-on Earnings</span>
                  <span className="text-sm font-bold text-purple-600">
                    ₹{trackerState.progress.addOnEarnings.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ⚠️ IMPORTANT NOTICE - NO FORMULAS */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900 text-center">
              <strong>Note:</strong> Earnings calculated automatically by system. Focus on quality work!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ====== COMPONENT 6: ADD-ON DISPLAY (PASSIVE ONLY) ====== */}
      {breakdown.breakdown.addOnServices > 0 && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Award className="w-5 h-5" />
              Add-on Services Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-5 bg-white rounded-lg border-2 border-purple-300 shadow-md">
              <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Services Completed</p>
              <p className="text-4xl font-bold text-purple-600">{breakdown.breakdown.addOnServices}</p>
              {trackerState.progress.addOnEarnings > 0 && (
                <p className="text-lg text-purple-700 mt-3 font-semibold">
                  Earned: ₹{trackerState.progress.addOnEarnings.toLocaleString()}
                </p>
              )}
            </div>

            {/* 🚫 READ-ONLY NOTICE - NO INTERACTION */}
            <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-300">
              <p className="text-xs text-purple-900 text-center font-medium">
                ℹ️ Add-ons are assigned by system/telecaller. Focus on execution only.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== COMPONENT 7: MONTHLY POTENTIAL (DYNAMIC) ====== */}
      {trackerState.monthlyPotential.isRealistic && trackerState.progress.isBaseComplete && (
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <TrendingUp className="w-5 h-5" />
              Monthly Incentive Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-5 bg-white rounded-lg border-2 border-indigo-300 shadow-md">
              <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Estimated Monthly Potential</p>
              <p className="text-4xl font-bold text-indigo-600">
                ₹{trackerState.monthlyPotential.estimated.toLocaleString()}
              </p>
              <p className="text-sm text-indigo-700 mt-2">{trackerState.monthlyPotential.note}</p>
            </div>

            <div className="mt-3 p-3 bg-indigo-100 rounded-lg">
              <p className="text-xs text-indigo-900 text-center">
                💡 This is a dynamic estimate based on your current performance. Keep working to increase your
                potential!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== COMPONENT 8: MAX LIMIT INDICATOR ====== */}
      {(trackerState.displayMessages.nearLimit || trackerState.displayMessages.atLimit) && (
        <Card
          className={`border-2 ${
            trackerState.displayMessages.atLimit
              ? "border-red-400 bg-red-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <CardHeader>
            <CardTitle
              className={`flex items-center gap-2 ${
                trackerState.displayMessages.atLimit ? "text-red-900" : "text-amber-900"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              Daily Limit Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress to Limit */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700">Units Today</span>
                <span className="text-sm font-bold text-gray-900">
                  {trackerState.progress.totalUnitsToday} / {trackerState.progress.maxDailyLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 transition-all duration-500 ${
                    trackerState.displayMessages.atLimit ? "bg-red-600" : "bg-amber-500"
                  }`}
                  style={{
                    width: `${(trackerState.progress.totalUnitsToday / trackerState.progress.maxDailyLimit) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Warning Message */}
            {trackerState.displayMessages.nearLimit && !trackerState.displayMessages.atLimit && (
              <div className="p-3 bg-amber-100 border border-amber-300 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Approaching Daily Limit</p>
                  <p className="text-sm text-amber-800">{trackerState.displayMessages.nearLimit}</p>
                </div>
              </div>
            )}

            {/* Limit Reached Message */}
            {trackerState.displayMessages.atLimit && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">Daily Limit Reached</p>
                  <p className="text-sm text-red-800">{trackerState.displayMessages.atLimit}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Compact version for dashboard (Updated)
export function IncentiveTrackerCompact() {
  const [trackerState, setTrackerState] = useState<IncentiveTrackerState | null>(null);

  useEffect(() => {
    const updateState = () => {
      const state = incentiveEngineService.getTrackerState();
      setTrackerState(state);
    };

    updateState();
    const interval = setInterval(updateState, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!trackerState) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Today's Earnings */}
      <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg shadow-sm">
        <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Today's Earnings</p>
        <p className="text-3xl font-bold text-green-600">
          ₹{trackerState.progress.todayEarnings.toLocaleString()}
        </p>
      </div>

      {/* Status */}
      <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg shadow-sm">
        <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Status</p>
        <Badge className={`${trackerState.eligibilityBadge.color} text-white text-sm`}>
          {trackerState.eligibilityBadge.icon} {trackerState.eligibilityBadge.text}
        </Badge>
      </div>
    </div>
  );
}
