/**
 * SCREEN 1: HOME / DASHBOARD
 * Core washer home screen with status, targets, and quick actions
 * Design Principle: Function-first, clear status, action-driven
 */

import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

export type DayStatus = "NOT_CHECKED_IN" | "WORKING" | "LATE" | "WEEK_OFF" | "CHECKED_OUT" | "ABSENT";

export interface WasherHomeDashboardProps {
  washerName: string;
  todayDate: Date;
  dayNumber: number; // Day X of 30 (rolling 30-day subscription window)
  totalDaysInMonth: number; // 30 (rolling 30-day subscription window — not calendar month)
  
  // Status
  dayStatus: DayStatus;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  checkInTime?: Date;
  isWeekOff: boolean;
  isLate: boolean;
  
  // Targets & Performance
  unitsCompleted: number;
  unitsTarget: number; // 25
  incentiveUnits: number; // Units above 25
  
  // Earnings
  todayEarnings: number;
  monthlyEarnings: number;
  
  // Actions
  onCheckIn: () => void;
  onViewSchedule: () => void;
  onViewEarnings: () => void;
  onRaiseIssue: () => void;
  
  // System
  isOnline: boolean;
}

export function WasherHomeDashboard({
  washerName,
  todayDate,
  dayNumber,
  totalDaysInMonth,
  dayStatus,
  isCheckedIn,
  isCheckedOut,
  checkInTime,
  isWeekOff,
  isLate,
  unitsCompleted,
  unitsTarget,
  incentiveUnits,
  todayEarnings,
  monthlyEarnings,
  onCheckIn,
  onViewSchedule,
  onViewEarnings,
  onRaiseIssue,
  isOnline = true,
}: WasherHomeDashboardProps) {
  const getStatusConfig = () => {
    if (isWeekOff) {
      return {
        label: "Week Off",
        color: "bg-blue-100 text-blue-700 border-blue-300",
        icon: Calendar,
      };
    }
    if (isCheckedOut) {
      return {
        label: "Day Completed",
        color: "bg-green-100 text-green-700 border-green-300",
        icon: CheckCircle,
      };
    }
    if (dayStatus === "ABSENT") {
      return {
        label: "Absent",
        color: "bg-red-100 text-red-700 border-red-300",
        icon: AlertCircle,
      };
    }
    if (isLate) {
      return {
        label: "Late",
        color: "bg-amber-100 text-amber-700 border-amber-300",
        icon: Clock,
      };
    }
    if (isCheckedIn) {
      return {
        label: "Working",
        color: "bg-green-100 text-green-700 border-green-300",
        icon: PlayCircle,
      };
    }
    return {
      label: "Not Checked In",
      color: "bg-gray-100 text-gray-700 border-gray-300",
      icon: Clock,
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const progressPercentage = ((unitsCompleted ?? 0) / (unitsTarget || 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Hi, {washerName}! 👋</h1>
            <p className="text-blue-100 text-sm mt-1">
              {todayDate.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-blue-100" />
            ) : (
              <WifiOff className="h-5 w-5 text-amber-300" />
            )}
          </div>
        </div>

        {/* Day Counter & Status */}
        <div className="flex items-center justify-between">
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-xs text-blue-100">Day Count</p>
            <p className="text-xl font-bold">
              Day {dayNumber} / {totalDaysInMonth}
            </p>
          </div>
          
          <Badge variant="outline" className={`${statusConfig.color} border-2 px-3 py-1`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="px-4 -mt-4 space-y-3">
        {/* Units Progress */}
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Today's Target</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {unitsCompleted ?? 0} / {unitsTarget ?? 0}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Remaining</p>
                <p className="text-xl font-bold text-blue-600">
                  {Math.max(0, (unitsTarget ?? 0) - (unitsCompleted ?? 0))}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 text-right mt-1">
              {Math.round(progressPercentage)}% Complete
            </p>
          </CardContent>
        </Card>

        {/* Incentive Units */}
        <Card className="border-2 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Incentive Units</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{incentiveUnits ?? 0}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Above Base</p>
                <p className="text-sm text-gray-700">
                  {(incentiveUnits ?? 0) > 0 ? 'Earning!' : 'Complete 25+ to earn'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings */}
        <Card className="border-2 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Today's Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{(todayEarnings ?? 0).toFixed(0)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">This Month</p>
                <p className="text-lg font-bold text-amber-600">
                  ₹{(monthlyEarnings ?? 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Week-off Highlight */}
        {isWeekOff && (
          <Card className="border-2 border-blue-300 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">Week Off Today</p>
                  <p className="text-sm text-blue-700">Enjoy your rest day!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Late Warning */}
        {isLate && !isWeekOff && (
          <Card className="border-2 border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-900">Late Check-In Recorded</p>
                  <p className="text-sm text-amber-700">
                    {checkInTime ? `Checked in at ${checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Avoid multiple late marks'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        
        {/* Check-In Button (Primary) */}
        {!isCheckedIn && !isWeekOff && !isCheckedOut && (
          <Button
            onClick={onCheckIn}
            className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg font-semibold shadow-lg"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Check-In to Start Day
          </Button>
        )}

        {/* View Schedule */}
        <Button
          onClick={onViewSchedule}
          disabled={!isCheckedIn}
          variant="outline"
          className="w-full h-12 border-2"
        >
          <Calendar className="h-5 w-5 mr-2" />
          View My Schedule
          {!isCheckedIn && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Check-in first
            </Badge>
          )}
        </Button>

        {/* View Earnings */}
        <Button
          onClick={onViewEarnings}
          variant="outline"
          className="w-full h-12 border-2"
        >
          <DollarSign className="h-5 w-5 mr-2" />
          View Earnings Details
        </Button>

        {/* Raise Issue */}
        <Button
          onClick={onRaiseIssue}
          variant="outline"
          className="w-full h-12 border-2 border-red-300 text-red-600 hover:bg-red-50"
        >
          <AlertCircle className="h-5 w-5 mr-2" />
          Raise an Issue
        </Button>
      </div>

      {/* Check-in Time Display */}
      {isCheckedIn && checkInTime && (
        <div className="px-4 mt-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">
                  Checked in at {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
