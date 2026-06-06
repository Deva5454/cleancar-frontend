/**
 * WASHER CORE SCREENS — CONNECTED
 * Self-contained flow: Dashboard → Check-In → Schedule → Active Wash → Check-Out → Day Summary
 * All state managed locally. Syncs to WasherContext but does NOT depend on it for flow control.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWasher, useWasherJobs } from "../../contexts/WasherContext";
import { WasherHomeDashboard, type DayStatus } from "./WasherHomeDashboard";
import { WasherCheckIn, type ValidationState } from "./WasherCheckIn";
import { WasherMySchedule, type JobCard } from "./WasherMySchedule";
import { WasherJobDetail } from "./WasherJobDetail";
import { WasherIncentiveTracker } from "./WasherIncentiveTracker";
import { WasherCheckOut } from "./WasherCheckOut";
import { DaySummaryScreen } from "./DaySummaryScreen";
import { mockWasherDataService } from "../../services/mockWasherDataService";
import type { CustomerJob } from "../../services/mockWasherDataService";

type Screen = "dashboard" | "checkin" | "schedule" | "active" | "incentive" | "checkout";

export function WasherCoreScreensConnected() {
  const navigate = useNavigate();

  // Context — used for profile/stats display only
  const { profile, dayStatus, stats, isLoading, refreshData } = useWasher();
  const { completedJobs } = useWasherJobs();

  // ── LOCAL FLOW STATE ──────────────────────────────────────────────────────
  const [screen, setScreen]           = useState<Screen>("dashboard");
  const [checkedIn, setCheckedIn]     = useState(false);
  const [checkedOut, setCheckedOut]   = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [showDaySummary, setShowDaySummary] = useState(false);

  // Jobs — seeded from mock service, mutations tracked here
  const [jobs, setJobs] = useState<CustomerJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Check-in camera state
  const [checkInPhoto, setCheckInPhoto]             = useState<string | null>(null);
  const [checkInValidations, setCheckInValidations] = useState<{
    face: ValidationState; numberPlate: ValidationState; gps: ValidationState;
  }>({ face: "PENDING", numberPlate: "PENDING", gps: "PENDING" });

  // Check-out camera state
  const [checkOutPhoto, setCheckOutPhoto]             = useState<string | null>(null);
  const [checkOutValidations, setCheckOutValidations] = useState<{
    face: ValidationState; gps: ValidationState;
  }>({ face: "PENDING", gps: "PENDING" });

  // ── SEED JOBS ON MOUNT ────────────────────────────────────────────────────
  useEffect(() => {
    mockWasherDataService.clearCache();
    const seeded = mockWasherDataService.getTodayJobs("WASHER-DEMO");
    setJobs(seeded);
  }, []);

  // ── DERIVED ───────────────────────────────────────────────────────────────
  const activeJob      = jobs.find(j => j.id === activeJobId) ?? null;
  const completedLocal = jobs.filter(j => j.status === "Completed");
  const pendingLocal   = jobs.filter(j => j.status === "Assigned" || j.status === "Acknowledged");

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const updateJobStatus = (jobId: string, status: CustomerJob["status"]) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));
    mockWasherDataService.updateJobStatus(jobId, status);
  };

  // ── HANDLERS: CHECK-IN ────────────────────────────────────────────────────
  const handleStartCheckInCamera = () => {
    setCheckInPhoto("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' style='background:%23d1fae5'%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%23065f46'%3ECheck-In Photo%3C/text%3E%3Ctext x='50%25' y='60%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%23059669'%3E✓ Captured%3C/text%3E%3C/svg%3E");
    setTimeout(() => setCheckInValidations({ face: "SUCCESS", numberPlate: "SUCCESS", gps: "SUCCESS" }), 600);
  };
  const handleRetakeCheckIn = () => {
    setCheckInPhoto(null);
    setCheckInValidations({ face: "PENDING", numberPlate: "PENDING", gps: "PENDING" });
  };
  const handleSubmitCheckIn = () => {
    setCheckedIn(true);
    setCheckInTime(new Date());
    // Navigate to active job if one exists, else schedule
    if (activeJobId) {
      setScreen("active");
    } else {
      setScreen("schedule");
    }
    refreshData();
  };

  // ── HANDLERS: SCHEDULE ────────────────────────────────────────────────────
  const handleStartJob = (jobId: string) => {
    updateJobStatus(jobId, "In Progress");
    setActiveJobId(jobId);
    setScreen("active");
  };
  const handleJobClick = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job?.status === "In Progress") {
      setActiveJobId(jobId);
      setScreen("active");
    }
  };

  // ── HANDLERS: ACTIVE WASH ─────────────────────────────────────────────────
  const handleCompleteJob = () => {
    if (activeJobId) updateJobStatus(activeJobId, "Completed");
    setActiveJobId(null);
    setScreen("schedule");
    refreshData();
  };

  // ── HANDLERS: CHECK-OUT ───────────────────────────────────────────────────
  const handleStartCheckOutCamera = () => {
    setCheckOutPhoto("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' style='background:%23d1fae5'%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%23065f46'%3ECheck-Out Photo%3C/text%3E%3Ctext x='50%25' y='60%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%23059669'%3E✓ Captured%3C/text%3E%3C/svg%3E");
    setTimeout(() => setCheckOutValidations({ face: "SUCCESS", gps: "SUCCESS" }), 600);
  };
  const handleRetakeCheckOut = () => {
    setCheckOutPhoto(null);
    setCheckOutValidations({ face: "PENDING", gps: "PENDING" });
  };
  const handleSubmitCheckOut = () => {
    setCheckedOut(true);
    setShowDaySummary(true);
  };

  // ── MAP JOBS TO CARDS ─────────────────────────────────────────────────────
  const mapJobsToCards = (): JobCard[] =>
    jobs.map((job, index) => ({
      id: job.id,
      registrationNumber: job.vehicleRegistration,
      ownerName: job.customerFirstName,
      vehicleType: job.vehicleCategory,
      packageName: job.packageName,
      location: `${job.area}, ${job.city}`,
      status: job.status === "In Progress" ? "IN_PROGRESS"
            : job.status === "Completed"   ? "DONE"
            : job.status === "Cancelled"   ? "ISSUE" : "PENDING",
      isCover: false,
      isLocked: !checkedIn || (activeJobId !== null && job.id !== activeJobId && job.status !== "Completed"),
      lockReason: !checkedIn ? "Complete check-in first"
                : (activeJobId !== null && job.id !== activeJobId) ? "Complete active job first" : undefined,
      sequenceNumber: index + 1,
      scheduledTime: job.timeSlot.split(" - ")[0],
      completedTime: job.status === "Completed" ? "Completed" : undefined,
    }));

  const mapDayStatus = (): DayStatus => {
    if (checkedOut) return "CHECKED_OUT";
    if (checkedIn)  return "WORKING";
    return "NOT_CHECKED_IN";
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (isLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  // ── DAY SUMMARY ───────────────────────────────────────────────────────────
  if (showDaySummary) {
    return (
      <DaySummaryScreen
        summaryData={{
          date: new Date().toISOString(),
          totalUnits: completedLocal.length,
          baseUnits: completedLocal.length,
          incentiveUnits: Math.max(0, completedLocal.length - 25),
          addOnServices: 0,
          todayEarnings: completedLocal.length * 150,
          incentiveEarnings: Math.max(0, completedLocal.length - 25) * 25,
          addOnEarnings: 0,
          totalWorkingTime: checkInTime
            ? `${Math.floor((Date.now() - checkInTime.getTime()) / 3600000)}h ${Math.floor(((Date.now() - checkInTime.getTime()) % 3600000) / 60000)}m`
            : "N/A",
          checkInTime: checkInTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "N/A",
          checkOutTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          attendanceStatus: "Present",
          performanceRating: completedLocal.length >= 25 ? "Excellent" : completedLocal.length >= 3 ? "Good" : "Average",
        }}
        onClose={() => { setShowDaySummary(false); setScreen("dashboard"); }}
      />
    );
  }

  // ── SCREEN CONTENT ────────────────────────────────────────────────────────
  const renderScreen = () => {
    switch (screen) {

      case "checkin":
        return jobs.length > 0 ? (
          <WasherCheckIn
            checkInWindow="WITHIN"
            windowStartTime={new Date(new Date().setHours(5, 0))}
            windowEndTime={new Date(new Date().setHours(9, 0))}
            firstCar={{
              registrationNumber: jobs[0].vehicleRegistration,
              ownerName: jobs[0].customerFirstName,
              vehicleType: jobs[0].vehicleCategory,
              package: jobs[0].packageName,
              location: `${jobs[0].area}, ${jobs[0].city}`,
            }}
            validation={checkInValidations}
            isCameraActive={checkInPhoto !== null}
            photoTaken={checkInPhoto !== null}
            photoUrl={checkInPhoto || undefined}
            onStartCamera={handleStartCheckInCamera}
            onTakePhoto={() => setCheckInValidations({ face: "SUCCESS", numberPlate: "SUCCESS", gps: "SUCCESS" })}
            onRetakePhoto={handleRetakeCheckIn}
            onSubmitCheckIn={handleSubmitCheckIn}
            isSubmitting={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-lg font-medium">No jobs assigned today</p>
          </div>
        );

      case "schedule":
        return (
          <WasherMySchedule
            jobs={mapJobsToCards()}
            isCheckedIn={checkedIn}
            activeJobId={activeJobId || undefined}
            onJobClick={handleJobClick}
            onStartJob={handleStartJob}
          />
        );

      case "active": {
        const currentJob = activeJob
          ? { ...activeJob, status: "In Progress" as const }
          : null;
        return currentJob ? (
          <WasherJobDetail
            job={currentJob}
            onBack={() => setScreen("schedule")}
            onStartJob={() => {
              updateJobStatus(currentJob.id, "In Progress");
              setActiveJobId(currentJob.id);
            }}
            onCompleteJob={handleCompleteJob}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-6 text-center">
            <p className="text-lg font-medium">No active job</p>
            <p className="text-sm mt-2">Go to Schedule and tap "Start Job"</p>
          </div>
        );
      }

      case "incentive":
        return (
          <WasherIncentiveTracker
            data={{
              baseUnits: 25,
              completedUnits: completedLocal.length,
              incentiveUnits: Math.max(0, completedLocal.length - 25),
              todayIncentiveEarnings: Math.max(0, completedLocal.length - 25) * 25,
              monthlyIncentiveUnits: 0,
              monthlyIncentiveEarnings: 0,
              timeBandStatus: "ACTIVE",
              timeBandExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000),
              eligibilityStatus: "ELIGIBLE",
              eligibilityReason: "Meeting all criteria",
              hasAttendanceImpact: false,
              lateMarksCount: 0,
              units4W: completedLocal.length,
              units2W: 0,
              addOnCount: 0,
              addOnEarnings: 0,
            }}
            currentDate={new Date()}
            monthName={new Date().toLocaleString("en-IN", { month: "long" })}
          />
        );

      case "checkout":
        return checkedIn && completedLocal.length > 0 ? (
          <WasherCheckOut
            checkOutTiming="ON_TIME"
            expectedCheckOutTime={new Date(new Date().setHours(9, 0))}
            lastCar={{
              registrationNumber: completedLocal[completedLocal.length - 1].vehicleRegistration,
              ownerName: completedLocal[completedLocal.length - 1].customerFirstName,
              vehicleType: completedLocal[completedLocal.length - 1].vehicleCategory,
              package: completedLocal[completedLocal.length - 1].packageName,
              location: `${completedLocal[completedLocal.length - 1].area}, ${completedLocal[completedLocal.length - 1].city}`,
              completedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }}
            totalJobsCompleted={completedLocal.length}
            validation={checkOutValidations}
            isCameraActive={checkOutPhoto !== null}
            photoTaken={checkOutPhoto !== null}
            photoUrl={checkOutPhoto || undefined}
            onStartCamera={handleStartCheckOutCamera}
            onTakePhoto={() => setCheckOutValidations({ face: "SUCCESS", gps: "SUCCESS" })}
            onRetakePhoto={handleRetakeCheckOut}
            onSubmitCheckOut={handleSubmitCheckOut}
            isSubmitting={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-6 text-center">
            {!checkedIn
              ? <><p className="text-lg font-medium">Not checked in yet</p><p className="text-sm mt-1">Complete check-in first to start your day</p></>
              : <><p className="text-lg font-medium">No completed jobs yet</p><p className="text-sm mt-1">Complete at least one wash to enable check-out</p></>
            }
          </div>
        );

      default: // dashboard
        return (
          <WasherHomeDashboard
            washerName={profile?.name || "Rajesh Kumar"}
            todayDate={new Date()}
            dayNumber={15}
            totalDaysInMonth={26}
            dayStatus={mapDayStatus()}
            isCheckedIn={checkedIn}
            isCheckedOut={checkedOut}
            checkInTime={checkInTime || undefined}
            isWeekOff={false}
            isLate={false}
            unitsCompleted={completedLocal.length}
            unitsTarget={25}
            incentiveUnits={Math.max(0, completedLocal.length - 25)}
            todayEarnings={completedLocal.length * 150}
            monthlyEarnings={12500}
            onCheckIn={() => setScreen("checkin")}
            onViewSchedule={() => setScreen("schedule")}
            onViewEarnings={() => setScreen("incentive")}
            onRaiseIssue={() => navigate("/complaints")}
            isOnline={true}
          />
        );
    }
  };

  // ── BOTTOM NAV ────────────────────────────────────────────────────────────
  const navItems = [
    { screen: "dashboard" as Screen, label: "Home",      icon: "🏠" },
    { screen: "checkin"   as Screen, label: "Check-In",  icon: "✅" },
    { screen: "schedule"  as Screen, label: "Schedule",  icon: "📋" },
    { screen: "active"    as Screen, label: "Active",    icon: "🚿" },
    { screen: "incentive" as Screen, label: "Earnings",  icon: "₹"  },
    { screen: "checkout"  as Screen, label: "Check-Out", icon: "🔚" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="min-h-screen">{renderScreen()}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-6 h-16">
          {navItems.map(({ screen: s, label, icon }) => {
            const isActive = screen === s;
            return (
              <button
                key={s}
                onClick={() => setScreen(s)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                  isActive ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span className="text-[10px] font-medium leading-none">{label}</span>
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
