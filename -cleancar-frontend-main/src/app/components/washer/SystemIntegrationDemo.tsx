/**
 * System Integration Demo Page
 * Showcases all new system-aware UI components
 * For testing and validation purposes
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { OfflineIndicator, type OfflineState } from "./OfflineIndicator";
import { SyncStatusBadge, type SyncStatus } from "./SyncStatusBadge";
import { OCRValidationFallback, type ValidationStatus } from "./OCRValidationFallback";
import { TimeBandTimer } from "./TimeBandTimer";
import { SupervisorOverrideNotice, type OverrideType, type OverrideStatus } from "./SupervisorOverrideNotice";
import { SessionLockScreen, type LockReason } from "./SessionLockScreen";
import { StandardErrorComponent, type ErrorType } from "./StandardErrorComponent";
import { CustomerNotificationFeedback } from "./CustomerNotificationFeedback";
import { EdgeCaseHandler, type EdgeCaseType } from "./EdgeCaseHandler";
import { logger } from "../../services/logger";

export function SystemIntegrationDemo() {
  // Offline state
  const [offlineState, setOfflineState] = useState<OfflineState>("ONLINE");
  
  // OCR state
  const [ocrStatus, setOcrStatus] = useState<ValidationStatus>("SUCCESS");
  const [ocrAttempts, setOcrAttempts] = useState(0);
  
  // Time band
  const [showTimer, setShowTimer] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date>(new Date());
  
  // Session lock
  const [lockReason, setLockReason] = useState<LockReason | null>(null);

  const handleStartTimer = () => {
    setTimerStartTime(new Date());
    setShowTimer(true);
  };

  const handleOCRRetry = () => {
    setOcrAttempts(prev => prev + 1);
    if (ocrAttempts >= 2) {
      setOcrStatus("PENDING_APPROVAL");
    } else {
      setOcrStatus("RETRY");
    }
  };

  // If session is locked, show lock screen
  if (lockReason) {
    return (
      <div>
        <SessionLockScreen
          reason={lockReason}
          supervisorPhone=""
          lockedAt={new Date()}
          isTemporaryAccess={lockReason === "TEMPORARY_ACCESS"}
        />
        <div className="fixed top-4 right-4 z-50">
          <Button onClick={() => setLockReason(null)}>
            Unlock (Demo Only)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>System Integration Demo</CardTitle>
            <p className="text-sm text-gray-600">
              Test all new system-aware UI components
            </p>
          </CardHeader>
        </Card>

        <Tabs defaultValue="offline" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="offline">Offline</TabsTrigger>
            <TabsTrigger value="ocr">OCR/AI</TabsTrigger>
            <TabsTrigger value="timeband">Time Band</TabsTrigger>
            <TabsTrigger value="overrides">Overrides</TabsTrigger>
          </TabsList>

          {/* TAB 1: OFFLINE MODE */}
          <TabsContent value="offline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Offline Mode Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setOfflineState("ONLINE")} size="sm">
                    Online
                  </Button>
                  <Button onClick={() => setOfflineState("OFFLINE")} size="sm" variant="outline">
                    Offline
                  </Button>
                  <Button onClick={() => setOfflineState("SYNCING")} size="sm" variant="outline">
                    Syncing
                  </Button>
                  <Button onClick={() => setOfflineState("SYNC_FAILED")} size="sm" variant="outline">
                    Sync Failed
                  </Button>
                  <Button onClick={() => setOfflineState("SYNCED")} size="sm" variant="outline">
                    Synced
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Offline Indicator */}
            <OfflineIndicator
              state={offlineState}
              pendingSyncCount={3}
              lastSyncTime={new Date()}
              onRetrySync={() => setOfflineState("SYNCING")}
            />

            {/* Sync Status Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sync Status Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-sm w-24">Full:</span>
                    <SyncStatusBadge status="SYNCED" />
                    <SyncStatusBadge status="PENDING" />
                    <SyncStatusBadge status="SYNCING" />
                    <SyncStatusBadge status="FAILED" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-sm w-24">Compact:</span>
                    <SyncStatusBadge status="SYNCED" compact />
                    <SyncStatusBadge status="PENDING" compact />
                    <SyncStatusBadge status="SYNCING" compact />
                    <SyncStatusBadge status="FAILED" compact />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edge Case: Offline + Completed Jobs */}
            <EdgeCaseHandler
              type="OFFLINE_COMPLETED_JOBS"
              pendingCount={3}
            />
          </TabsContent>

          {/* TAB 2: OCR/AI VALIDATION */}
          <TabsContent value="ocr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">OCR Validation Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => { setOcrStatus("VALIDATING"); setOcrAttempts(0); }} size="sm">
                    Validating
                  </Button>
                  <Button onClick={() => { setOcrStatus("SUCCESS"); setOcrAttempts(0); }} size="sm" variant="outline">
                    Success
                  </Button>
                  <Button onClick={() => { setOcrStatus("FAILED"); setOcrAttempts(0); }} size="sm" variant="outline">
                    Failed
                  </Button>
                  <Button onClick={() => { setOcrStatus("PENDING_APPROVAL"); setOcrAttempts(3); }} size="sm" variant="outline">
                    Pending Approval
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* OCR Validation Fallback */}
            <OCRValidationFallback
              type="CHECK_IN"
              status={ocrStatus}
              attemptCount={ocrAttempts}
              maxAttempts={2}
              onRetry={handleOCRRetry}
              onContinue={() => setOcrStatus("SUCCESS")}
              errorReason="Unable to detect vehicle number plate clearly"
            />

            {/* Edge Case: OCR Pending */}
            <EdgeCaseHandler
              type="OCR_PENDING_CONTINUED"
              jobName="Arjun's Elite Wash"
            />

            {/* Standard Error Examples */}
            <div className="space-y-4">
              <StandardErrorComponent
                type="OCR_FAILED"
                canRetry={true}
                onRetry={() => logger.log("Retry")}
              />
            </div>
          </TabsContent>

          {/* TAB 3: TIME BAND */}
          <TabsContent value="timeband" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Time Band Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleStartTimer}>
                  Start 4-Hour Timer
                </Button>
                <p className="text-xs text-gray-600">
                  Timer starts from current time. Will expire after 4 hours.
                </p>
              </CardContent>
            </Card>

            {/* Time Band Timer */}
            {showTimer && (
              <TimeBandTimer
                checkInTime={timerStartTime}
                durationHours={4}
                onExpire={() => logger.log("Timer expired")}
              />
            )}

            {/* Edge Case: Time Band Expired */}
            <EdgeCaseHandler
              type="TIME_BAND_EXPIRED_MID_JOB"
              jobName="Priya's Premium Wash"
            />

            {/* Customer Notification */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Notification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CustomerNotificationFeedback
                  isNotified={true}
                  notificationTime={new Date()}
                />
                <div>
                  <p className="text-sm text-gray-600 mb-2">Compact version:</p>
                  <CustomerNotificationFeedback
                    isNotified={true}
                    compact
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: OVERRIDES & SECURITY */}
          <TabsContent value="overrides" className="space-y-4">
            {/* Supervisor Overrides */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Supervisor Override Examples</CardTitle>
              </CardHeader>
            </Card>

            <SupervisorOverrideNotice
              type="ATTENDANCE"
              status="PENDING"
              reason="Late arrival due to vehicle breakdown"
              supervisorName="Suresh Yadav"
              appliedDate={new Date()}
            />

            <SupervisorOverrideNotice
              type="INCENTIVE"
              status="APPROVED"
              reason="Exceptional performance during festival week"
              supervisorName="Suresh Yadav"
              appliedDate={new Date()}
              details="Completed 35 units with 98% quality score"
            />

            {/* Session Lock Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Lock Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setLockReason("DEVICE_LOST")} size="sm" variant="destructive">
                    Device Lost
                  </Button>
                  <Button onClick={() => setLockReason("SUPERVISOR_LOCK")} size="sm" variant="outline">
                    Supervisor Lock
                  </Button>
                  <Button onClick={() => setLockReason("SECURITY")} size="sm" variant="outline">
                    Security Lock
                  </Button>
                  <Button onClick={() => setLockReason("TEMPORARY_ACCESS")} size="sm" variant="outline">
                    Temporary Access
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  Click to see full-screen lock state. Use "Unlock" button at top-right to return.
                </p>
              </CardContent>
            </Card>

            {/* Edge Case: Session Locked */}
            <EdgeCaseHandler
              type="SESSION_LOCKED"
              details="Device reported lost by supervisor"
            />

            {/* Edge Case: Cover Jobs Locked */}
            <EdgeCaseHandler
              type="BASE_NOT_COMPLETE_COVER_LOCKED"
              pendingCount={5}
              details="Complete 3 more units to unlock"
            />
          </TabsContent>
        </Tabs>

        {/* Standard Error Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standard Error Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StandardErrorComponent
              type="NETWORK_ERROR"
              canRetry={true}
              onRetry={() => logger.log("Retry")}
            />
            <StandardErrorComponent
              type="SERVER_ERROR"
              canRetry={true}
              canDismiss={true}
              onRetry={() => logger.log("Retry")}
              onDismiss={() => logger.log("Dismiss")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
