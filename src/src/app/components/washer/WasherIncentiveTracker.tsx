import { WASHER, calcWasherIncentive } from "../../services/incentiveStructureV6";
/**
 * SCREEN 5: INCENTIVE TRACKER
 * Read-only incentive display with time band status
 * Design Principle: Transparent, no user interaction, clear eligibility
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { logger } from "../../services/logger";
import {
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Star,
  ShieldCheck,
  Edit,
  X,
} from "lucide-react";

export type TimeBandStatus = "ACTIVE" | "CLOSING_SOON" | "CLOSED";
export type EligibilityStatus = "ELIGIBLE" | "INELIGIBLE" | "AT_RISK";

export interface JobIncentiveBreakdown {
  jobId: string;
  customerName: string;
  qualityScore: number; // 0-100
  complianceScore: number; // 0-100
  baseAmount: number; // System calculated
  qualityBonus: number; // System calculated
  complianceBonus: number; // System calculated
  totalIncentive: number; // System calculated
}

export interface HROverride {
  originalAmount: number;
  overrideAmount: number;
  reason: string;
  approvedBy: string;
  approvalDate: string;
}

export interface IncentiveData {
  // Daily
  baseUnits: number; // 25
  completedUnits: number;
  incentiveUnits: number; // Units above 25
  todayIncentiveEarnings: number;

  // Monthly
  monthlyIncentiveUnits: number;
  monthlyIncentiveEarnings: number;

  // Time band
  timeBandStatus: TimeBandStatus;
  timeBandExpiry?: Date;

  // Eligibility
  eligibilityStatus: EligibilityStatus;
  eligibilityReason?: string;

  // Attendance impact
  lateMarksCount?: number;
  hasAttendanceImpact?: boolean;

  // Job-wise breakdown (NEW)
  jobBreakdowns?: JobIncentiveBreakdown[];

  // HR Override (NEW)
  hrOverride?: HROverride;
}

export interface WasherIncentiveTrackerProps {
  data: IncentiveData;
  currentDate: Date;
  monthName: string;
  userRole?: "washer" | "hr" | "admin"; // For showing HR override section
}

export function WasherIncentiveTracker({
  data,
  currentDate,
  monthName,
  userRole = "washer",
}: WasherIncentiveTrackerProps) {
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const handleApplyOverride = () => {
    // In real app: API call to apply override
    logger.log("Override applied:", { overrideAmount, overrideReason });
    setShowOverrideForm(false);
  };

  const getTimeBandConfig = () => {
    switch (data.timeBandStatus) {
      case "ACTIVE":
        return {
          label: "Earnings Active",
          color: "bg-green-100 text-green-700 border-green-300",
          icon: CheckCircle,
        };
      case "CLOSING_SOON":
        return {
          label: "Closing Soon",
          color: "bg-amber-100 text-amber-700 border-amber-300",
          icon: Clock,
        };
      case "CLOSED":
        return {
          label: "Window Closed",
          color: "bg-red-100 text-red-700 border-red-300",
          icon: AlertCircle,
        };
    }
  };

  const getEligibilityConfig = () => {
    switch (data.eligibilityStatus) {
      case "ELIGIBLE":
        return {
          label: "Eligible",
          color: "bg-green-100 text-green-700 border-green-300",
          icon: CheckCircle,
        };
      case "AT_RISK":
        return {
          label: "At Risk",
          color: "bg-amber-100 text-amber-700 border-amber-300",
          icon: AlertCircle,
        };
      case "INELIGIBLE":
        return {
          label: "Ineligible",
          color: "bg-red-100 text-red-700 border-red-300",
          icon: AlertCircle,
        };
    }
  };

  const timeBandConfig = getTimeBandConfig();
  const TimeBandIcon = timeBandConfig.icon;
  
  const eligibilityConfig = getEligibilityConfig();
  const EligibilityIcon = eligibilityConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-6 pb-8">
        <h1 className="text-2xl font-bold mb-2">Incentive Tracker</h1>
        <p className="text-purple-100 text-sm">
          {currentDate.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Today's Incentive */}
        <Card className="border-2 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Today's Incentive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Units Above Base */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600 mb-1">Units Above Base</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-green-600">
                    +{data.incentiveUnits}
                  </p>
                  <p className="text-sm text-gray-600">
                    / {data.completedUnits} total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-1">Base Target</p>
                <p className="text-2xl font-bold text-gray-700">{data.baseUnits}</p>
              </div>
            </div>

            {/* Today's Earnings */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Today's Incentive</p>
                  <p className="text-2xl font-bold text-green-700">
                    ₹{data.todayIncentiveEarnings.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress to next unit */}
            {data.incentiveUnits === 0 && data.completedUnits < data.baseUnits && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 mb-1">Next Milestone</p>
                <p className="text-sm font-semibold text-blue-900">
                  Complete {data.baseUnits - data.completedUnits} more units to unlock incentives
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Band Status */}
        <Card className={`border-2 ${
          data.timeBandStatus === "ACTIVE" ? "border-green-300" :
          data.timeBandStatus === "CLOSING_SOON" ? "border-amber-300" :
          "border-red-300"
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  data.timeBandStatus === "ACTIVE" ? "bg-green-100" :
                  data.timeBandStatus === "CLOSING_SOON" ? "bg-amber-100" :
                  "bg-red-100"
                }`}>
                  <TimeBandIcon className={`h-5 w-5 ${
                    data.timeBandStatus === "ACTIVE" ? "text-green-600" :
                    data.timeBandStatus === "CLOSING_SOON" ? "text-amber-600" :
                    "text-red-600"
                  }`} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Earning Window</p>
                  <p className="font-semibold text-gray-900">
                    {timeBandConfig.label}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={timeBandConfig.color}>
                {data.timeBandStatus === "CLOSED" ? "Closed" : "Active"}
              </Badge>
            </div>
            
            {data.timeBandExpiry && data.timeBandStatus !== "CLOSED" && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-600">
                  Expires at: {data.timeBandExpiry.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              {monthName} Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Monthly Units */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Incentive Units</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {data.monthlyIncentiveUnits}
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Earnings */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Incentive Earned</p>
                <p className="text-3xl font-bold text-purple-700">
                  ₹{data.monthlyIncentiveEarnings.toLocaleString('en-IN')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        {/* Eligibility Status */}
        <Card className={`border-2 ${eligibilityConfig.color.replace('bg-', 'border-').replace('100', '300')}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                data.eligibilityStatus === "ELIGIBLE" ? "bg-green-100" :
                data.eligibilityStatus === "AT_RISK" ? "bg-amber-100" :
                "bg-red-100"
              }`}>
                <EligibilityIcon className={`h-5 w-5 ${
                  data.eligibilityStatus === "ELIGIBLE" ? "text-green-600" :
                  data.eligibilityStatus === "AT_RISK" ? "text-amber-600" :
                  "text-red-600"
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">Eligibility Status</p>
                  <Badge variant="outline" className={eligibilityConfig.color}>
                    {eligibilityConfig.label}
                  </Badge>
                </div>
                {data.eligibilityReason && (
                  <p className="text-sm text-gray-700">{data.eligibilityReason}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Impact Warning */}
        {data.hasAttendanceImpact && data.lateMarksCount !== undefined && (
          <Card className="border-2 border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900 mb-1">
                    Attendance Impact on Incentive
                  </p>
                  <p className="text-sm text-amber-700">
                    You have {data.lateMarksCount} late {data.lateMarksCount === 1 ? 'mark' : 'marks'} this month.
                    Multiple late marks may impact your incentive eligibility.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job-wise Incentive Breakdown */}
        {data.jobBreakdowns && data.jobBreakdowns.length > 0 && (
          <Card className="border-2 border-teal-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-teal-600" />
                Job-wise Incentive Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Job ID</TableHead>
                      <TableHead className="text-xs">Customer</TableHead>
                      <TableHead className="text-xs text-center">Quality</TableHead>
                      <TableHead className="text-xs text-center">Compliance</TableHead>
                      <TableHead className="text-xs text-right">Base</TableHead>
                      <TableHead className="text-xs text-right">Q Bonus</TableHead>
                      <TableHead className="text-xs text-right">C Bonus</TableHead>
                      <TableHead className="text-xs text-right font-semibold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.jobBreakdowns.map((job) => (
                      <TableRow key={job.jobId}>
                        <TableCell className="text-xs font-medium">{job.jobId}</TableCell>
                        <TableCell className="text-xs">{job.customerName}</TableCell>
                        <TableCell className="text-xs text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-blue-600" />
                            <span className="font-medium">{job.qualityScore}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            <span className="font-medium">{job.complianceScore}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-right text-gray-600">
                          ₹{job.baseAmount}
                        </TableCell>
                        <TableCell className="text-xs text-right text-blue-600">
                          +₹{job.qualityBonus}
                        </TableCell>
                        <TableCell className="text-xs text-right text-purple-600">
                          +₹{job.complianceBonus}
                        </TableCell>
                        <TableCell className="text-xs text-right font-bold text-green-600">
                          ₹{job.totalIncentive}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* System Calculated Label */}
              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-700 text-center">
                  ✓ All amounts are <strong>System Calculated</strong> based on quality and compliance scores
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* HR Override Section (Only visible to HR/Admin) */}
        {(userRole === "hr" || userRole === "admin") && (
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Edit className="h-5 w-5 text-purple-600" />
                  HR Override
                </CardTitle>
                {!showOverrideForm && !data.hrOverride && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowOverrideForm(true)}
                    className="bg-white"
                  >
                    Apply Override
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Existing Override Display */}
              {data.hrOverride && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded border">
                      <p className="text-xs text-gray-600">Original Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{data.hrOverride.originalAmount}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded border border-purple-300">
                      <p className="text-xs text-purple-700">Override Amount</p>
                      <p className="text-lg font-bold text-purple-900">
                        ₹{data.hrOverride.overrideAmount}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded border">
                    <p className="text-xs text-gray-600 mb-1">Reason</p>
                    <p className="text-sm text-gray-900">{data.hrOverride.reason}</p>
                  </div>

                  <div className="p-3 bg-gray-100 rounded text-xs text-gray-700">
                    <p>
                      <strong>Approved by:</strong> {data.hrOverride.approvedBy}
                    </p>
                    <p className="mt-1">
                      <strong>Date:</strong>{" "}
                      {new Date(data.hrOverride.approvalDate).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}

              {/* Override Form */}
              {showOverrideForm && !data.hrOverride && (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded border">
                    <p className="text-xs text-gray-600">Current Total</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{data.todayIncentiveEarnings}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">(Read-only, system calculated)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="override-amount" className="text-sm font-semibold">
                      New Override Amount
                    </Label>
                    <Input
                      id="override-amount"
                      type="number"
                      placeholder="Enter new amount"
                      value={overrideAmount}
                      onChange={(e) => setOverrideAmount(e.target.value)}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="override-reason" className="text-sm font-semibold">
                      Reason (Required)
                    </Label>
                    <Textarea
                      id="override-reason"
                      placeholder="Enter reason for override..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="bg-white min-h-20"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleApplyOverride}
                      disabled={!overrideAmount || !overrideReason}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Apply Override
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowOverrideForm(false);
                        setOverrideAmount("");
                        setOverrideReason("");
                      }}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>

                  <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                    <p className="text-xs text-amber-700">
                      <strong>Note:</strong> Override will require approval tracking and will be
                      visible in audit logs.
                    </p>
                  </div>
                </div>
              )}

              {/* No Override Message */}
              {!showOverrideForm && !data.hrOverride && (
                <div className="p-3 bg-white rounded border text-center">
                  <p className="text-sm text-gray-600">
                    No override applied. Incentive is system-calculated.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Read-Only Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <p className="text-xs text-center text-blue-700">
              ℹ️ This tracker is read-only. Incentives are calculated automatically based on your performance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
