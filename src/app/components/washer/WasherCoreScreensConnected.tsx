/**
 * WASHER CORE SCREENS â€" CONNECTED
 * Self-contained flow: Dashboard â†’ Check-In â†’ Schedule â†’ Active Wash â†’ Check-Out â†’ Day Summary
 * All state managed locally. Syncs to WasherContext but does NOT depend on it for flow control.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWasher, useWasherJobs } from "../../contexts/WasherContext";
import { useRole } from "../../contexts/RoleContext";

import { WasherHomeDashboard, type DayStatus } from "./WasherHomeDashboard";
import { WasherCheckIn, type ValidationState } from "./WasherCheckIn";
import { WasherMySchedule, type JobCard } from "./WasherMySchedule";
import { WasherJobDetail } from "./WasherJobDetail";
import { WasherIncentiveTracker } from "./WasherIncentiveTracker";
import { WasherCheckOut } from "./WasherCheckOut";
import { DaySummaryScreen } from "./DaySummaryScreen";
import { mockWasherDataService, computePeriodicFlagsB } from "../../services/mockWasherDataService";
import type { CustomerJob } from "../../services/mockWasherDataService";
type Screen = "dashboard" | "checkin" | "schedule" | "active" | "incentive" | "checkout";

export function WasherCoreScreensConnected() {
  const navigate = useNavigate();

  // Context â€" used for profile/stats display only
  const { profile, stats, refreshData } = useWasher();
  const { completedJobs } = useWasherJobs();
  const { currentUser } = useRole();

  // â"€â"€ LOCAL FLOW STATE â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [screen, setScreen]           = useState<Screen>("dashboard");
  const [checkedIn, setCheckedIn]     = useState(false);
  const [checkedOut, setCheckedOut]   = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [showDaySummary, setShowDaySummary] = useState(false);

  // Jobs â€" seeded from mock service, mutations tracked here
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

  // ── SEED + LOAD JOBS ─────────────────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const washerId = (currentUser as any)?.employeeId || "WASHER-DEMO";
    const seedKey = `cc360_washer_demo_seeded_${washerId}_${today}`;
    if (!localStorage.getItem(seedKey)) {
      try {
        const now = new Date(); const h = now.getHours(); const m = now.getMinutes();
        const fmt = (hr: number, mn: number) => `${String(hr%24).padStart(2,"0")}:${String(mn).padStart(2,"0")}`;
        const slots = [0,1,2,3,4].map(i => { const tot=h*60+m+i*45; return `${fmt(Math.floor(tot/60),tot%60)} - ${fmt(Math.floor((tot+30)/60),(tot+30)%60)}`; });
        const s1 = new Date(Date.now()-15*86400000).toISOString().split("T")[0];
        const s2 = new Date(Date.now()-7*86400000).toISOString().split("T")[0];
        const s3 = new Date(Date.now()-10*86400000).toISOString().split("T")[0];
        const demos = [
          { jobId:`DEMO-${washerId}-001`, customerName:"Arjun Patel", packageType:"EXPRESS_WASH", vehicleDetails:{category:"Hatchback",color:"White",brand:"Maruti",registration:"GJ-05-AK-1234"}, location:{addressLine1:"B-204, Sunrise Residency, Adajan",area:"Adajan",city:"Surat",pinCode:"395001"}, serviceDetails:{addOns:[],specialInstructions:"Park car in original spot after wash"}, subscriptionStartDate:s3, timeSlot:slots[0], parkingInstructions:"Society parking - left side near gate" },
          { jobId:`DEMO-${washerId}-002`, customerName:"Priya Shah", packageType:"SMART_WASH", vehicleDetails:{category:"Mid-Size Sedan",color:"Silver",brand:"Honda",registration:"GJ-05-BK-5678"}, location:{addressLine1:"A-301, Royal Heights, Vesu",area:"Vesu",city:"Surat",pinCode:"395007"}, serviceDetails:{addOns:[],specialInstructions:"Avoid high pressure on windows"}, subscriptionStartDate:s1, timeSlot:slots[1], parkingInstructions:"Covered parking slot 15" },
          { jobId:`DEMO-${washerId}-003`, customerName:"Vikram Trivedi", packageType:"ELITE_WASH", vehicleDetails:{category:"Mid/Large SUV",color:"Black",brand:"Toyota",registration:"GJ-05-CM-9012"}, location:{addressLine1:"C-101, Prime Apartments, Citylight",area:"Citylight",city:"Surat",pinCode:"395007"}, serviceDetails:{addOns:[],specialInstructions:"Extra attention to wheels"}, subscriptionStartDate:s2, timeSlot:slots[2], parkingInstructions:"Basement parking B2, Slot 42" },
          { jobId:`DEMO-${washerId}-004`, customerName:"Meera Joshi", packageType:"SMART_WASH", isCoverJob:true, vehicleDetails:{category:"Hatchback",color:"Red",brand:"Tata",registration:"GJ-05-DM-3456"}, location:{addressLine1:"D-402, Green Park, Piplod",area:"Piplod",city:"Surat",pinCode:"395009"}, serviceDetails:{addOns:[],specialInstructions:"Cover job - original washer on leave"}, subscriptionStartDate:s1, timeSlot:slots[3], parkingInstructions:"Main gate parking" },
          { jobId:`DEMO-${washerId}-005`, customerName:"Ravi Desai", packageType:"EXPRESS_WASH", vehicleDetails:{category:"Compact Sedan",color:"Blue",brand:"Maruti",registration:"GJ-05-ER-7890"}, location:{addressLine1:"E-105, Shanti Nagar, Althan",area:"Althan",city:"Surat",pinCode:"395010"}, serviceDetails:{addOns:["Interior Cleaning"],specialInstructions:"Sensitive to chemical smells"}, subscriptionStartDate:s3, timeSlot:slots[4], parkingInstructions:"Visitor parking near lobby" },
        ].map((d: any, i: number) => ({...d, washerId, scheduledDate:today, status: i === 0 ? "In Progress" : "Assigned", jobType:"Regular", packageName:d.packageType, customerId:`CUST-${d.jobId}`, cityId:"CITY-SURAT", city:"Surat", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()}));
        const existing = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs")||"[]").filter((j: any) => !(j.washerId===washerId && j.scheduledDate===today && String(j.jobId).startsWith("DEMO-")));
        localStorage.setItem("cleancar_CITY-SURAT_jobs", JSON.stringify([...existing, ...demos]));
        localStorage.setItem(seedKey, "1");
      } catch(_) {}
    }
    let loaded: CustomerJob[] = [];
    try {
      const raw = localStorage.getItem("cleancar_CITY-SURAT_jobs");
      if (raw) {
        const myJobs = JSON.parse(raw).filter((j: any) => j.washerId===washerId && j.scheduledDate===today && ["Assigned","Acknowledged","In Progress"].includes(j.status));
        loaded = myJobs.map((j: any) => { const periodicFlags = (() => { try { return computePeriodicFlagsB(j.jobId, j.packageType || j.packageName || "EXPRESS_WASH", j.subscriptionStartDate || "2026-01-01"); } catch(_) { return {}; } })(); return { id:j.jobId, timeSlot:j.timeSlot||"06:00 AM", customerFirstName:j.customerName||"Customer", area:j.location?.area||"Surat", pinCode:j.location?.pinCode||"395001", city:j.city||"Surat", addressLine1:j.location?.addressLine1||"", vehicleCategory:j.vehicleDetails?.category||"Sedan", vehicleColor:j.vehicleDetails?.color||"White", vehicleBrand:j.vehicleDetails?.brand||"Maruti", vehicleRegistration:j.vehicleDetails?.registration||"", packageName:j.packageType||j.packageName||"EXPRESS_WASH", packageType:j.packageType||j.packageName||"EXPRESS_WASH", serviceFrequency:"Daily", subscriptionMonth:today.slice(0,7), subscriptionStartDate:j.subscriptionStartDate||"2026-01-01", jobType:j.jobType||"Regular", status:j.status||"Assigned", specialInstructions:j.serviceDetails?.specialInstructions||"", parkingInstructions:j.parkingInstructions||"", isCoverJob:j.isCoverJob||false, serviceDetails:j.serviceDetails||{addOns:[]}, customerId:j.customerId||"", ...periodicFlags }; });
      }
    } catch(_) {}
    if (loaded.length === 0) { mockWasherDataService.clearCache(); loaded = mockWasherDataService.getTodayJobs(washerId); }
    setJobs(loaded);
  }, [(currentUser as any)?.employeeId]);

  // â"€â"€ DERIVED â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const activeJob      = jobs.find(j => j.id === activeJobId) ?? null;
  const completedLocal = jobs.filter(j => j.status === "Completed");
  const pendingLocal   = jobs.filter(j => j.status === "Assigned" || j.status === "Acknowledged");

  // â"€â"€ HELPERS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const updateJobStatus = (jobId: string, status: CustomerJob["status"]) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));
    mockWasherDataService.updateJobStatus(jobId, status);
    // Persist status to localStorage so supervisor sees the update
    try {
      const key = "cleancar_CITY-SURAT_jobs";
      const allJobs = JSON.parse(localStorage.getItem(key) || "[]");
      const updated = allJobs.map((j: any) =>
        j.jobId === jobId ? { ...j, status, updatedAt: new Date().toISOString() } : j
      );
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (_) {}
  };

  // â"€â"€ HANDLERS: CHECK-IN â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleStartCheckInCamera = () => {
    setCheckInPhoto("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' style='background:%23d1fae5'%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%23065f46'%3ECheck-In Photo%3C/text%3E%3Ctext x='50%25' y='60%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%23059669'%3E%E2%9C%93 Captured%3C/text%3E%3C/svg%3E");
    setTimeout(() => setCheckInValidations({ face: "SUCCESS", numberPlate: "SUCCESS", gps: "SUCCESS" }), 600);
  };
  const handleRetakeCheckIn = () => {
    setCheckInPhoto(null);
    setCheckInValidations({ face: "PENDING", numberPlate: "PENDING", gps: "PENDING" });
  };
  const handleSubmitCheckIn = () => {
    setCheckedIn(true);
    const checkInNow = new Date();
    setCheckInTime(checkInNow);

    // Persist check-in to attendance records so supervisor can see it
    try {
      const washerId = (currentUser as any)?.employeeId || "";
      if (washerId) {
        const today = checkInNow.toISOString().split("T")[0];
        const timeStr = `${String(checkInNow.getHours()).padStart(2,"0")}:${String(checkInNow.getMinutes()).padStart(2,"0")}:00`;
        const attKey = "cleancar_CITY-SURAT_attendance_records";
        const records = JSON.parse(localStorage.getItem(attKey) || "[]");
        const existingIdx = records.findIndex((r: any) => r.employeeId === washerId && r.date === today);
        const newRecord = {
          attendanceId: `ATT-${washerId}-${today}`,
          employeeId: washerId,
          cityId: "CITY-SURAT",
          date: today,
          status: "Present",
          checkInTime: timeStr,
          lateMinutes: checkInNow.getHours() >= 9 ? (checkInNow.getHours() - 9) * 60 + checkInNow.getMinutes() : 0,
          checkOutTime: undefined,
        };
        if (existingIdx >= 0) {
          records[existingIdx] = { ...records[existingIdx], checkInTime: timeStr, status: "Present" };
        } else {
          records.push(newRecord);
        }
        localStorage.setItem(attKey, JSON.stringify(records));

        // Also save field check-in session for supervisor selfie/GPS
        const sessionKey = `field_checkin_session_${washerId}`;
        const session = {
          employeeId: washerId,
          checkInTime: checkInNow.toISOString(),
          checkInSelfieBase64: checkInPhoto || "",
          gpsLat: null,
          gpsLng: null,
          date: today,
        };
        localStorage.setItem(sessionKey, JSON.stringify(session));
      }
    } catch (_) {}

    // Fix: start GPS tracking on check-in
    const currentJob = activeJobId ? jobs.find(j => j.id === activeJobId) : null;
    const washerEmployeeId = (currentUser as any)?.employeeId || "";
    if (activeJobId && washerEmployeeId) {
      import("../../services/washerLocationService").then(({ startTracking }) => {
        startTracking(washerEmployeeId, activeJobId);
      });
    }

    // Fix 3: Send WA to customer — washer arrived
    if (currentJob) {
      import("../../services/whatsappService").then(ws => {
        import("../../services/washerLocationService").then(({ getTrackingUrl }) => {
          const trackingUrl = getTrackingUrl(activeJobId || "");
          ws.sendWasherArrived({
            customerPhone: currentJob.customerPhone || currentJob.customer?.phone || "",
            customerName: currentJob.customerName || "Customer",
            washerName: currentUser?.employeeName || profile?.name || "Your Washer",
            supervisorName: currentJob.supervisorName || "",
            supervisorPhone: currentJob.supervisorPhone || "",
            trackingUrl,
            planLabel: currentJob.packageName || "Wash",
          });
        });
      });
    }

    // Navigate to active job if one exists, else schedule
    if (activeJobId) {
      setScreen("active");
    } else {
      setScreen("schedule");
    }
    refreshData();
  };

  // â"€â"€ HANDLERS: SCHEDULE â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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

  // â"€â"€ HANDLERS: ACTIVE WASH â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleCompleteJob = () => {
    if (activeJobId) updateJobStatus(activeJobId, "Completed");
    setActiveJobId(null);
    setScreen("schedule");
    refreshData();
  };

  // â"€â"€ HANDLERS: CHECK-OUT â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleStartCheckOutCamera = () => {
    setCheckOutPhoto("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' style='background:%23d1fae5'%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%23065f46'%3ECheck-Out Photo%3C/text%3E%3Ctext x='50%25' y='60%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%23059669'%3E%E2%9C%93 Captured%3C/text%3E%3C/svg%3E");
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

  // â"€â"€ MAP JOBS TO CARDS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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
      isCover: (job as any).isCoverJob === true,
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
  // â"€â"€ DAY SUMMARY â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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

  // â"€â"€ SCREEN CONTENT â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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
            forceInProgress={true}
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
              baseUnits: 20,
              completedUnits: completedLocal.length,
              incentiveUnits: Math.max(0, completedLocal.length - 20),
              todayIncentiveEarnings: Math.max(0, completedLocal.length - 20) * 25,
              monthlyIncentiveUnits: 0,
              monthlyIncentiveEarnings: 0,
              timeBandStatus: "ACTIVE",
              timeBandExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              eligibilityStatus: "ELIGIBLE",
              eligibilityReason: "Meeting all criteria",
              hasAttendanceImpact: false,
              lateMarksCount: 0,
              units4W: completedLocal.length,
              units2W: 0,
              addOnCount: 0,
              addOnEarnings: 0,
            }}
            currentDate={new Date().toISOString()}
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
            washerName={currentUser?.employeeName || profile?.name || "Washer"}
            todayDate={new Date()}
            dayNumber={new Date().getDate()}
            totalDaysInMonth={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}
            dayStatus={mapDayStatus()}
            isCheckedIn={checkedIn}
            isCheckedOut={checkedOut}
            checkInTime={checkInTime || undefined}
            isWeekOff={false}
            isLate={false}
            unitsCompleted={completedLocal.length}
            unitsTarget={20}
            incentiveUnits={Math.max(0, completedLocal.length - 20)}
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

  // â"€â"€ BOTTOM NAV â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€









  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="min-h-screen">{renderScreen()}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-6 h-16">
          {(["dashboard","checkin","schedule","active","incentive","checkout"] as Screen[]).map((s) => {
            const isActive = screen === s;
            const labels: Record<Screen,string> = { dashboard:"Home", checkin:"Check-In", schedule:"Schedule", active:"Active", incentive:"Earnings", checkout:"Check-Out" };
            const renderIcon = (sc: Screen) => {
              const cls = "w-5 h-5";
              if (sc === "dashboard") return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
              if (sc === "checkin")   return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
              if (sc === "schedule")  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
              if (sc === "active")    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
              if (sc === "incentive") return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
              return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
            };
            return (
              <button
                key={s}
                onClick={() => setScreen(s)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative ${isActive ? "text-teal-600 bg-teal-50" : "text-gray-400 hover:text-gray-600"}`}
              >
                {renderIcon(s)}
                <span className="text-[10px] font-medium leading-none">{labels[s]}</span>
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-600 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


export default WasherCoreScreensConnected;



