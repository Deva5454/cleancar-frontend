/**
 * Edge Case Handler Component
 * Handles various edge case states with clear messaging
 * Design Principle: Clear state + what it means + what to do
 */

import { AlertCircle, Clock, WifiOff, Lock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export type EdgeCaseType =
  | "OFFLINE_COMPLETED_JOBS"
  | "OCR_PENDING_CONTINUED"
  | "TIME_BAND_EXPIRED_MID_JOB"
  | "SESSION_LOCKED"
  | "BASE_NOT_COMPLETE_COVER_LOCKED";

export interface EdgeCaseHandlerProps {
  type: EdgeCaseType;
  details?: string;
  jobName?: string;
  pendingCount?: number;
}

export function EdgeCaseHandler({ 
  type, 
  details, 
  jobName,
  pendingCount = 0 
}: EdgeCaseHandlerProps) {
  // 1. OFFLINE + COMPLETED JOBS
  if (type === "OFFLINE_COMPLETED_JOBS") {
    return (
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <WifiOff className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                Awaiting Sync
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                Actions saved locally
              </p>
              {pendingCount > 0 && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-white">
                    {pendingCount} {pendingCount === 1 ? 'job' : 'jobs'} pending sync
                  </Badge>
                </div>
              )}
              <div className="mt-3 bg-white p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">What this means:</span><br />
                  Your completed jobs are saved on your device and will automatically sync when you're back online.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. OCR FAILED BUT CONTINUED
  if (type === "OCR_PENDING_CONTINUED") {
    return (
      <Card className="border-2 border-purple-300 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900">
                  Verification Pending
                </h3>
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  Under Review
                </Badge>
              </div>
              {jobName && (
                <p className="text-sm text-gray-700 mb-2">
                  Job: {jobName}
                </p>
              )}
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Status:</span><br />
                  Photo verification failed but you've been allowed to continue. 
                  Supervisor will review manually.
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-purple-700">
                <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                <span>Awaiting supervisor approval</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. TIME BAND EXPIRED MID-JOB
  if (type === "TIME_BAND_EXPIRED_MID_JOB") {
    return (
      <Card className="border-2 border-red-300 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                Earning Window Closed
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                Job will not earn incentive
              </p>
              {jobName && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-white">
                    {jobName}
                  </Badge>
                </div>
              )}
              <div className="mt-3 bg-white p-3 rounded-lg border border-red-200">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">What this means:</span><br />
                  Your 4-hour earning window has closed. You can still complete this job, 
                  but it will not count toward incentive earnings.
                </p>
              </div>
              <div className="mt-3 text-xs text-red-700">
                ⏰ Complete jobs within the earning window to maximize earnings
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 4. SESSION LOCKED
  if (type === "SESSION_LOCKED") {
    return (
      <Card className="border-2 border-red-300 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                Access Restricted
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                Contact supervisor
              </p>
              <div className="mt-3 bg-white p-3 rounded-lg border border-red-200">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">What to do:</span><br />
                  Your session has been locked. Please contact your supervisor to unlock and continue working.
                </p>
              </div>
              {details && (
                <div className="mt-2 text-xs text-red-700">
                  Reason: {details}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 5. BASE NOT COMPLETE - COVER JOBS LOCKED
  if (type === "BASE_NOT_COMPLETE_COVER_LOCKED") {
    return (
      <Card className="border-2 border-teal-300 bg-teal-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                Cover Jobs Locked
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                Complete base quota first
              </p>
              {pendingCount > 0 && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-white">
                    +{pendingCount} cover {pendingCount === 1 ? 'job' : 'jobs'} assigned
                  </Badge>
                </div>
              )}
              <div className="mt-3 bg-white p-3 rounded-lg border border-teal-200">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">What this means:</span><br />
                  You have additional cover jobs assigned, but they will only be visible 
                  after you complete your base 25 units.
                </p>
              </div>
              <div className="mt-3 text-xs text-teal-700">
                🎯 {details || "Complete your base units to unlock cover jobs"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
