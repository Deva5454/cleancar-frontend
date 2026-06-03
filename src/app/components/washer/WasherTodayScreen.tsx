// Today Screen - Washer's Command Center
// Mobile-optimized job list with large touch targets
// NOW WITH: Week-off visibility + Cover job progressive disclosure
import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Clock,
  MapPin,
  Car,
  AlertTriangle,
  CheckCircle,
  Play,
  FileText,
  Bell,
  Package as PackageIcon,
  Wifi,
  WifiOff,
  Calendar,
  Lock,
  Unlock,
  Info,
  ShieldCheck,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { WasherJobDetail } from "./WasherJobDetail";
import { IncentiveTrackerCompact } from "../workflow/IncentiveTracker";
import { weekOffCoverService } from "../../services/weekOffCoverService";
import { mockWasherDataService } from "../../services/mockWasherDataService";
import type { WasherDayContext, CoverJob } from "../../types/weekOffCover";
import type { CustomerJob } from "../../services/mockWasherDataService";
import { SystemAlert, type AlertType } from "./SystemAlert";
import { PerformanceStatus, type PerformanceState } from "./PerformanceStatus";
import { EmergencyHelpButton } from "./EmergencyHelpButton";
import { SystemTrackingIndicator } from "./SystemTrackingIndicator";
import { FlowStageIndicator, type DayStage } from "./FlowStageIndicator";
import { CheckInSuccessBanner } from "./CheckInSuccessBanner";
import { IncentiveUnlockBanner } from "./IncentiveUnlockBanner";
import { TimeBandClosedBanner } from "./TimeBandClosedBanner";
import { PreDayPreview } from "./PreDayPreview";
import { DaySummaryScreen, type DaySummaryData } from "./DaySummaryScreen";
import { incentiveEngineService } from "../../services/incentiveEngineService";

export function WasherTodayScreen() {
  const { currentUser } = useRole();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<CustomerJob | null>(null);
  const [isOnline] = useState(true); // In real app: navigator.onLine

  // Week-off & Cover job state
  const [dayContext, setDayContext] = useState<WasherDayContext | null>(null);
  const [showCoverNotification, setShowCoverNotification] = useState(false);

  // Supervisor visibility & monitoring state
  const [systemAlerts, setSystemAlerts] = useState<Array<{ id: string; type: AlertType; message?: string; details?: string }>>([]);
  const [performanceStatus, setPerformanceStatus] = useState<PerformanceState>("on-track");
  const [showEmergencyConfirmation, setShowEmergencyConfirmation] = useState(false);

  // Flow stage management
  const [currentDayStage, setCurrentDayStage] = useState<DayStage>("pre-day");
  const [showCheckInBanner, setShowCheckInBanner] = useState(false);
  const [showIncentiveUnlock, setShowIncentiveUnlock] = useState(false);
  const [isTimeBandClosed, setIsTimeBandClosed] = useState(false);
  const [showDaySummary, setShowDaySummary] = useState(false);
  const [daySummaryData, setDaySummaryData] = useState<DaySummaryData | null>(null);

  // Incentive engine state
  const [incentiveTrackerState, setIncentiveTrackerState] = useState(
    incentiveEngineService.getTrackerState()
  );

  // Job filter state
  const [jobFilter, setJobFilter] = useState<"all" | "verified" | "qa-pending" | "failed">("all");

  // Load data from service - NO HARD-CODED DATA
  const washerId = "WASHER-001"; // In real app: currentUser.id
  const washerJobs = mockWasherDataService.getTodayJobs(washerId, 12);
  const washerStats = mockWasherDataService.getWasherStats(washerId);

  // Load day context on mount and when base units change
  useEffect(() => {
    const loadDayContext = () => {
      const context = weekOffCoverService.getWasherDayContext("WASHER-001");
      setDayContext(context);

      // Check for unread notifications
      const unread = weekOffCoverService.getUnreadNotifications("WASHER-001");
      if (unread.length > 0 && isClockedIn) {
        setShowCoverNotification(true);
      }
    };

    loadDayContext();
    const interval = setInterval(loadDayContext, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isClockedIn, washerStats.completed]); // Re-load when completion changes

  // Check for in-progress job (resume banner)
  const currentInProgressJob = mockWasherDataService.getInProgressJob(washerId);

  // Filter jobs based on verification status
  const filteredJobs = washerJobs.filter((job) => {
    if (jobFilter === "all") return true;
    if (jobFilter === "verified") return job.status === "Verified";
    if (jobFilter === "qa-pending") return (job as any).qaRequired === true;
    if (jobFilter === "failed") return job.status === "Failed";
    return true;
  });

  const handleClockIn = () => {
    const now = new Date();
    const time = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setClockInTime(time);
    setIsClockedIn(true);

    // Update flow stage
    setCurrentDayStage("base-execution");
    setShowCheckInBanner(true);

    // Register check-in with week-off service
    weekOffCoverService.checkIn("WASHER-001");

    // Check if late check-in (after 7:15 AM)
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour > 7 || (currentHour === 7 && currentMinute > 15)) {
      const lateAlert = {
        id: `alert-late-${Date.now()}`,
        type: "late-check-in" as AlertType,
        details: `Checked in at ${time} - Expected by 7:15 AM`,
      };
      setSystemAlerts((prev) => [lateAlert, ...prev]);
    }
  };

  const handleClockOut = () => {
    // Get accurate data from incentive engine
    const progress = incentiveEngineService.getProgress();
    const breakdown = incentiveEngineService.getEarningsBreakdown();

    // Calculate working time
    const checkInDate = clockInTime ? new Date(`1970-01-01T${clockInTime}`) : new Date();
    const checkOutDate = new Date();
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const totalWorkingTime = `${hours}h ${minutes}m`;

    // Generate day summary data with actual performance metrics
    const summary: DaySummaryData = {
      date: new Date().toISOString(),
      totalUnits: progress.totalUnitsToday,
      baseUnits: progress.baseUnitsCompleted,
      incentiveUnits: progress.incentiveUnitsCompleted,
      addOnServices: breakdown.breakdown.addOnServices,
      todayEarnings: progress.todayEarnings,
      incentiveEarnings: progress.incentiveEarnings,
      addOnEarnings: progress.addOnEarnings,
      totalWorkingTime,
      checkInTime: clockInTime || "N/A",
      checkOutTime: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      attendanceStatus: progress.isLateCheckIn ? "Late" : "Present",
      performanceRating: progress.isBaseComplete
        ? "Excellent"
        : progress.baseUnitsCompleted >= 20
        ? "Good"
        : progress.baseUnitsCompleted >= 15
        ? "Average"
        : "Needs Improvement",
      penalties: [],
      baseNotAchieved: !progress.isBaseComplete,
      lateCheckInPenalty: progress.isLateCheckIn,
      unitsOutsideBand: progress.unitsOutsideBand,
    };

    // Add penalty details
    if (!progress.isBaseComplete) {
      summary.penalties?.push({
        type: "base-not-achieved",
        message: "Base target not achieved — no incentive earned",
        severity: "high",
      });
    }

    if (progress.isLateCheckIn) {
      summary.penalties?.push({
        type: "late-check-in",
        message: progress.penaltyReason || "Late check-in may impact incentive eligibility",
        severity: "medium",
      });
    }

    if (progress.unitsOutsideBand > 0) {
      summary.penalties?.push({
        type: "units-outside-band",
        message: `${progress.unitsOutsideBand} unit(s) completed outside earning window`,
        severity: "low",
      });
    }

    setDaySummaryData(summary);
    setShowDaySummary(true);
    setCurrentDayStage("day-complete");
    setIsClockedIn(false);
  };

  const handleDismissCoverNotification = () => {
    setShowCoverNotification(false);
    const unread = weekOffCoverService.getUnreadNotifications("WASHER-001");
    unread.forEach((n) => weekOffCoverService.markNotificationRead(n.id));
  };

  const handleJobClick = (job: CustomerJob) => {
    setSelectedJob(job);
  };

  const handleBackFromJob = () => {
    setSelectedJob(null);
  };

  const handleStartJob = () => {
    // Update job status to In Progress
  };

  const handleCompleteJob = () => {
    // Navigate back and update job status
    setSelectedJob(null);
  };

  const handleEmergency = () => {
    // Add emergency sent alert
    const emergencyAlert = {
      id: `alert-${Date.now()}`,
      type: "emergency-sent" as AlertType,
    };
    setSystemAlerts((prev) => [emergencyAlert, ...prev]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setSystemAlerts((prev) => prev.filter((a) => a.id !== emergencyAlert.id));
    }, 5000);
  };

  const handleDismissAlert = (alertId: string) => {
    setSystemAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Calculate performance status based on completion rate
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Only check performance after 7:45 AM and if clocked in
    if (isClockedIn && (currentHour > 7 || (currentHour === 7 && currentMinute >= 45))) {
      const completionRate = washerStats.jobsToday > 0
        ? washerStats.completed / washerStats.jobsToday
        : 0;

      // Before 10 AM, should have completed at least 30%
      // Before 12 PM, should have completed at least 50%
      // After 2 PM, should have completed at least 80%
      if (currentHour < 10 && completionRate < 0.3) {
        setPerformanceStatus("behind-schedule");
      } else if (currentHour < 12 && completionRate < 0.5) {
        setPerformanceStatus("behind-schedule");
      } else if (currentHour >= 14 && completionRate < 0.8) {
        setPerformanceStatus("action-required");
      } else {
        setPerformanceStatus("on-track");
      }
    }
  }, [washerStats.completed, isClockedIn]);

  // Monitor base completion for incentive unlock
  useEffect(() => {
    if (washerStats.completed >= 25 && currentDayStage === "base-execution") {
      setCurrentDayStage("incentive-unlocked");
      setShowIncentiveUnlock(true);
    }
  }, [washerStats.completed, currentDayStage]);

  // Sync incentive engine state with UI
  useEffect(() => {
    const updateIncentiveState = () => {
      const state = incentiveEngineService.getTrackerState();
      setIncentiveTrackerState(state);

      // Sync time band status from incentive engine
      const isTimeBandActive = state.timeBandIndicator.status === "ACTIVE";
      setIsTimeBandClosed(!isTimeBandActive);

      // Update flow stage based on time band closure
      if (!isTimeBandActive && currentDayStage === "incentive-unlocked") {
        setCurrentDayStage("time-closed");
      }
    };

    if (isClockedIn) {
      updateIncentiveState();
      const interval = setInterval(updateIncentiveState, 2000); // Sync every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isClockedIn, currentDayStage]);

  // Helper functions - moved before JSX
  const getTimeSlotBadgeColor = (job: CustomerJob) => {
    if (job.overdue) return "bg-red-100 text-red-700 border-red-300";
    if (job.startingSoon) return "bg-amber-100 text-amber-700 border-amber-300";
    return "bg-green-100 text-green-700 border-green-300";
  };

  const getJobTypeBadgeColor = (jobType: string) => {
    switch (jobType) {
      case "One-Time Demo":
        return "bg-amber-100 text-amber-700";
      case "Subscription Demo":
        return "bg-teal-100 text-teal-700";
      case "Regular":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Assigned":
        return "bg-blue-100 text-blue-700";
      case "Acknowledged":
        return "bg-teal-100 text-teal-700";
      case "In Progress":
        return "bg-amber-100 text-amber-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getActionButton = (job: CustomerJob) => {
    switch (job.status) {
      case "Assigned":
        return (
          <Button
            onClick={() => handleJobClick(job)}
            className="w-full min-h-[48px] bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base"
          >
            View Details
          </Button>
        );
      case "In Progress":
        return (
          <Button
            onClick={() => handleJobClick(job)}
            className="w-full min-h-[48px] bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base animate-pulse"
          >
            <Play className="w-4 h-4 mr-2" />
            Resume Job
          </Button>
        );
      case "Completed":
        return (
          <Button
            onClick={() => handleJobClick(job)}
            variant="outline"
            className="w-full min-h-[48px] font-semibold text-base"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Report
          </Button>
        );
      default:
        return (
          <Button
            onClick={() => handleJobClick(job)}
            className="w-full min-h-[48px] bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base"
          >
            View Details
          </Button>
        );
    }
  };

  // If day summary should be shown
  if (showDaySummary && daySummaryData) {
    return (
      <DaySummaryScreen
        summaryData={daySummaryData}
        onClose={() => {
          setShowDaySummary(false);
          setCurrentDayStage("pre-day");
        }}
      />
    );
  }

  // If job detail is selected, show job detail screen
  if (selectedJob) {
    return (
      <WasherJobDetail
        job={selectedJob}
        onBack={handleBackFromJob}
        onStartJob={handleStartJob}
        onCompleteJob={handleCompleteJob}
      />
    );
  }

  // Incentive unlock modal (overlay)
  const incentiveUnlockOverlay = showIncentiveUnlock && (
    <IncentiveUnlockBanner
      incentiveRate={50}
      onAcknowledge={() => setShowIncentiveUnlock(false)}
    />
  );

  // Main today screen
  return (
    <>
      {incentiveUnlockOverlay}
      <div className="space-y-4 p-3 sm:p-4">
      {/* Resume Banner - Highest Priority */}
      {currentInProgressJob && (
        <div
          onClick={() => handleJobClick(currentInProgressJob)}
          className="bg-teal-600 text-white rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-teal-700 transition-colors"
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Play className="w-6 h-6 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-semibold text-base">You have an active job in progress</p>
              <p className="text-sm opacity-90">
                {currentInProgressJob.customerFirstName}, {currentInProgressJob.timeSlot}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-white text-teal-600 hover:bg-gray-100 min-h-[48px] text-base"
            >
              Resume
            </Button>
          </div>
        </div>
      )}

      {/* Greeting Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Good morning, {currentUser.name.split(' ')[0]}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* ====== FLOW STAGE INDICATOR ====== */}
      {isClockedIn && dayContext?.dayStatus !== "WEEK_OFF" && (
        <FlowStageIndicator
          currentStage={currentDayStage}
          baseUnits={incentiveTrackerState.progress.baseUnitsCompleted}
          baseTarget={incentiveTrackerState.config.baseQuota}
          isTimeBandActive={incentiveTrackerState.timeBandIndicator.status === "ACTIVE"}
        />
      )}

      {/* ====== CHECK-IN SUCCESS BANNER ====== */}
      {showCheckInBanner && clockInTime && (
        <CheckInSuccessBanner
          checkInTime={clockInTime}
          firstJobTimeSlot={washerJobs[0]?.timeSlot}
          onDismiss={() => setShowCheckInBanner(false)}
        />
      )}

      {/* ====== TIME BAND CLOSED BANNER ====== */}
      {isTimeBandClosed && isClockedIn && (
        <TimeBandClosedBanner
          closedAt={new Date().getHours() >= 12 && new Date().getHours() < 16 ? "12:00 PM" : "8:00 PM"}
          remainingJobs={washerStats.remaining}
          onProceedToCheckout={washerStats.remaining === 0 ? handleClockOut : undefined}
        />
      )}

      {/* ====== SYSTEM TRACKING INDICATOR ====== */}
      <SystemTrackingIndicator />

      {/* ====== SYSTEM ALERTS (SUPERVISOR VISIBILITY) ====== */}
      {systemAlerts.map((alert) => (
        <SystemAlert
          key={alert.id}
          type={alert.type}
          message={alert.message}
          details={alert.details}
          onDismiss={() => handleDismissAlert(alert.id)}
        />
      ))}

      {/* ====== PERFORMANCE STATUS ====== */}
      {isClockedIn && dayContext?.dayStatus !== "WEEK_OFF" && (
        <PerformanceStatus
          status={performanceStatus}
          message={
            performanceStatus === "on-track"
              ? `${washerStats.completed}/${washerStats.jobsToday} jobs completed`
              : performanceStatus === "behind-schedule"
              ? `Complete ${washerStats.remaining} more jobs to catch up`
              : "Contact supervisor immediately"
          }
        />
      )}

      {/* ====== EMERGENCY HELP BUTTON ====== */}
      {isClockedIn && dayContext?.dayStatus !== "WEEK_OFF" && (
        <EmergencyHelpButton onEmergency={handleEmergency} />
      )}

      {/* ====== DAY STATUS INDICATOR (NEW) ====== */}
      {dayContext && (
        <Card className={`border-2 ${dayContext.dayInfo.color}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="text-3xl">{dayContext.dayInfo.icon}</div>
              <div className="flex-1">
                <p className="font-bold text-lg">{dayContext.dayInfo.message}</p>
                {dayContext.dayStatus === "WEEK_OFF" && (
                  <p className="text-sm mt-1 opacity-80">
                    Scheduled week-off. Enjoy your day!
                  </p>
                )}
                {dayContext.dayStatus === "COVER" && dayContext.hasCoverJobs && (
                  <p className="text-sm mt-1 opacity-80">
                    {dayContext.coverSummary?.totalCoverUnits} additional jobs assigned
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== WEEK-OFF INFO (NEW) ====== */}
      {dayContext && dayContext.dayStatus !== "WEEK_OFF" && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              Your weekly off: <strong>{dayContext.weekOffSchedule.assignedWeekOffDay}</strong>
              {dayContext.weekOffSchedule.isRotational && " (rotational)"}
            </span>
          </div>
        </div>
      )}

      {/* ====== COVER NOTIFICATION (NEW) ====== */}
      {showCoverNotification && dayContext?.hasCoverJobs && (
        <Card className="border-2 border-teal-300 bg-teal-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-teal-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-teal-900">
                  {dayContext.coverSummary?.totalCoverUnits} cover job
                  {(dayContext.coverSummary?.totalCoverUnits || 0) > 1 ? "s" : ""} assigned
                </p>
                <p className="text-sm text-teal-800 mt-1">
                  Complete your base units first to unlock cover jobs
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismissCoverNotification}
                className="text-teal-900"
              >
                Got it
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== WEEK-OFF DAY SCREEN (Blocks execution) ====== */}
      {dayContext?.dayStatus === "WEEK_OFF" && (
        <Card className="border-2 border-purple-300 bg-purple-50">
          <CardContent className="p-3 sm:p-6 text-center">
            <div className="text-6xl mb-4">🌙</div>
            <h3 className="text-xl font-bold text-purple-900 mb-2">
              You are on a scheduled week-off today
            </h3>
            <p className="text-purple-800 mb-4">
              Execution is disabled. Relax and recharge!
            </p>
            {dayContext.weekOffSchedule.nextWeekOff && (
              <p className="text-sm text-purple-700">
                Next working day:{" "}
                {new Date(dayContext.weekOffSchedule.nextWeekOff).toLocaleDateString("en-IN", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Only show execution UI if NOT week-off */}
      {dayContext?.dayStatus !== "WEEK_OFF" && (
        <>
          {/* Clock In/Out Button */}
          {!isClockedIn ? (
            <Button
              onClick={handleClockIn}
              className="w-full min-h-[48px] bg-teal-600 hover:bg-teal-700 text-white text-base font-semibold"
            >
              <Clock className="w-5 h-5 mr-2" />
              Clock In
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Clocked in at {clockInTime}</span>
                </div>
              </div>
              <Button
                onClick={handleClockOut}
                variant="outline"
                className="w-full min-h-[48px] text-base"
              >
                Clock Out
              </Button>
            </div>
          )}

          {/* Daily Summary Strip */}
          <div className="space-y-3">
            {/* Capacity Indicator */}
            <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-medium text-teal-900">Worker Capacity</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-teal-600">
                    {washerStats.completed}/{washerStats.jobsToday}
                  </span>
                  <span className="text-sm text-teal-700">jobs</span>
                </div>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(washerStats.completed / washerStats.jobsToday) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                <p className="text-2xl font-bold text-teal-600">{washerStats.jobsToday}</p>
                <p className="text-xs text-gray-600 mt-1">Jobs Today</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                <p className="text-2xl font-bold text-green-600">{washerStats.completed}</p>
                <p className="text-xs text-gray-600 mt-1">Completed</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                <p className="text-2xl font-bold text-amber-600">{washerStats.inProgress}</p>
                <p className="text-xs text-gray-600 mt-1">In Progress</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                <p className="text-2xl font-bold text-blue-600">{washerStats.remaining}</p>
                <p className="text-xs text-gray-600 mt-1">Remaining</p>
              </div>
            </div>
          </div>

          {/* Incentive Tracker - Shows earnings for the day */}
          <div>
            <IncentiveTrackerCompact />
          </div>

          {/* ====== COVER JOB SUMMARY (Progressive Disclosure - BEFORE BASE) ====== */}
          {dayContext?.hasCoverJobs && dayContext.coverSummary && !dayContext.canSeeCoverDetails && (
        <Card className="border-2 border-teal-300 bg-teal-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Lock className="w-6 h-6 text-teal-600" />
              <div className="flex-1">
                <p className="font-bold text-lg text-teal-900">
                  {dayContext.coverSummary.message}
                </p>
                <p className="text-sm text-teal-800 mt-1">
                  Complete base quota ({dayContext.baseQuota - dayContext.baseUnitsCompleted} more) to unlock cover jobs
                </p>
                {dayContext.coverSummary.fromWashers.length > 0 && (
                  <p className="text-xs text-teal-700 mt-2">
                    From: {dayContext.coverSummary.fromWashers.join(", ")}
                  </p>
                )}
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">
                  +{dayContext.coverSummary.totalCoverUnits}
                </div>
                <div className="text-xs text-teal-700 mt-1">Cover Units</div>
              </div>
            </div>
          </CardContent>
        </Card>
          )}

          {/* ====== COVER JOBS UNLOCKED MESSAGE (After base completion) ====== */}
          {dayContext?.canSeeCoverDetails && dayContext.coverJobs.length > 0 && (
            <Card className="border-2 border-green-300 bg-green-50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Unlock className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-bold text-lg text-green-900">
                      Cover Jobs Unlocked!
                    </p>
                    <p className="text-sm text-green-800 mt-1">
                      {dayContext.coverJobs.length} additional job
                      {dayContext.coverJobs.length > 1 ? "s" : ""} now visible below.
                      These contribute to incentives!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alert Banners */}
          <div className="space-y-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">You have a new demo request</p>
                  <p className="text-xs text-amber-700 mt-1">Tap to review</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <PackageIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Replenishment approved</p>
                  <p className="text-xs text-green-700 mt-1">Car Wash Shampoo — collect from Supervisor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Job List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Today's Jobs</h3>

            {/* Job Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <Button
                variant={jobFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setJobFilter("all")}
                className={jobFilter === "all" ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                All Jobs ({washerJobs.length})
              </Button>
              <Button
                variant={jobFilter === "verified" ? "default" : "outline"}
                size="sm"
                onClick={() => setJobFilter("verified")}
                className={jobFilter === "verified" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Verified ({washerJobs.filter((j) => j.status === "Verified").length})
              </Button>
              <Button
                variant={jobFilter === "qa-pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setJobFilter("qa-pending")}
                className={jobFilter === "qa-pending" ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                QA Pending ({washerJobs.filter((j) => (j as any).qaRequired === true).length})
              </Button>
              <Button
                variant={jobFilter === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setJobFilter("failed")}
                className={jobFilter === "failed" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                Failed ({washerJobs.filter((j) => j.status === "Failed").length})
              </Button>
            </div>

            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className={`border-2 ${
                    job.status === "In Progress"
                      ? "border-amber-300 bg-amber-50"
                      : "border-gray-200"
                  }`}
                >
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    {/* Card Header - Time Slot and Job Type */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`${getTimeSlotBadgeColor(
                          job
                        )} border px-3 py-1.5 text-sm font-semibold`}
                      >
                        <Clock className="w-4 h-4 mr-1.5" />
                        {job.timeSlot}
                      </Badge>
                      <Badge className={`${getJobTypeBadgeColor(job.jobType)} px-3 py-1.5 text-sm`}>
                        {job.jobType}
                      </Badge>
                    </div>

                    {/* Card Body - Customer and Vehicle Info */}
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-gray-900">
                        {job.customerFirstName}
                      </p>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {job.area} • {job.pinCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Car className="w-4 h-4" />
                        <span className="font-medium">
                          {job.vehicleCategory} · {job.vehicleColor}
                        </span>
                      </div>
                      <div className="bg-teal-50 rounded px-2 py-1.5 inline-block">
                        <p className="text-sm font-semibold text-teal-700">
                          {job.packageName}
                        </p>
                      </div>
                      {job.specialInstructions && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                          <p className="text-xs text-blue-800">
                            <strong>Note:</strong> {job.specialInstructions}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer - Status and Action */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getStatusBadgeColor(job.status)} px-3 py-1.5`}>
                          {job.status}
                        </Badge>
                        {/* Verification Status Badges */}
                        {job.status === "Verified" && (
                          <Badge className="bg-green-100 text-green-700 border border-green-300 px-2 py-1">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {(job as any).qaRequired && (
                          <Badge className="bg-amber-100 text-amber-700 border border-amber-300 px-2 py-1">
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            QA Required
                          </Badge>
                        )}
                        {job.status === "Failed" && (
                          <Badge className="bg-red-100 text-red-700 border border-red-300 px-2 py-1">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                      {getActionButton(job)}
                    </div>
                  </CardContent>
                </Card>
              ))}

          {/* ====== COVER JOBS (Progressive Disclosure - AFTER BASE) ====== */}
          {dayContext?.canSeeCoverDetails && dayContext.coverJobs.length > 0 && (
            <>
              {/* Cover Jobs Section Header */}
              <div className="pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t-2 border-teal-300"></div>
                  <p className="text-sm font-bold text-teal-700 uppercase tracking-wide">
                    Cover Jobs ({dayContext.coverJobs.length})
                  </p>
                  <div className="flex-1 border-t-2 border-teal-300"></div>
                </div>
              </div>

              {/* Render Cover Jobs */}
              {dayContext.coverJobs.map((coverJob) => (
                <Card key={coverJob.id} className="border-2 border-teal-300 bg-teal-50">
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    {/* Cover Job Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-teal-600 text-white border-teal-700 px-3 py-1.5 text-sm font-bold">
                        🔁 COVER JOB
                      </Badge>
                      <Badge className="bg-teal-100 text-teal-800 px-3 py-1.5 text-sm">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {coverJob.timeSlot}
                      </Badge>
                      <Badge className="bg-amber-100 text-amber-800 px-2 py-1 text-xs">
                        From {coverJob.originalWasher}
                      </Badge>
                    </div>

                    {/* Cover Job Info Note */}
                    <div className="bg-teal-100 border border-teal-300 rounded p-2">
                      <p className="text-xs text-teal-900">
                        <Info className="w-3 h-3 inline mr-1" />
                        This job was redistributed from <strong>{coverJob.originalWasher}</strong> (
                        {coverJob.coverReason === "WEEK_OFF"
                          ? "Week-off"
                          : coverJob.coverReason === "LEAVE"
                          ? "On leave"
                          : "Absent"}
                        )
                      </p>
                    </div>

                    {/* Customer and Vehicle Info (Same as regular jobs) */}
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-gray-900">{coverJob.customerFirstName}</p>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {coverJob.area} • {coverJob.pinCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Car className="w-4 h-4" />
                        <span className="font-medium">
                          {coverJob.vehicleCategory} · {coverJob.vehicleColor}
                        </span>
                      </div>
                      <div className="bg-white rounded px-2 py-1.5 inline-block border border-teal-200">
                        <p className="text-sm font-semibold text-teal-700">{coverJob.packageName}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() =>
                        handleJobClick({
                          id: coverJob.jobId,
                          timeSlot: coverJob.timeSlot,
                          customerFirstName: coverJob.customerFirstName,
                          area: coverJob.area,
                          pinCode: coverJob.pinCode,
                          city: coverJob.city,
                          addressLine1: coverJob.addressLine1,
                          vehicleCategory: coverJob.vehicleCategory,
                          vehicleColor: coverJob.vehicleColor,
                          vehicleBrand: coverJob.vehicleBrand,
                          vehicleRegistration: coverJob.vehicleRegistration,
                          packageName: coverJob.packageName,
                          packageType: coverJob.packageType,
                          serviceFrequency: "",
                          subscriptionMonth: "",
                          jobType: "Regular",
                          status: coverJob.status as any,
                          specialNotes: coverJob.specialNotes,
                        })
                      }
                      className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                    >
                      View Details
                    </Button>

                    {/* Incentive Notice */}
                    {dayContext.isBaseComplete && (
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="text-xs text-green-900 text-center">
                          ✅ This job contributes to your incentives
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              </>
            )}
            </div>
          </div>

          {/* Clock Out - Shown at end of day */}
          {isClockedIn && (
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full h-14 border-2 border-gray-300 text-gray-700 font-semibold"
              >
                <Clock className="w-5 h-5 mr-2" />
                Clock Out for the Day
              </Button>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}
