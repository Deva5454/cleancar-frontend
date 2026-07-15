"""
fix_washer_p0_p1.py — Fix critical washer module issues

Fix 9:  computePeriodicFlagsB not called on mapped jobs
        → import from mockWasherDataService (re-exported from periodicScheduleService)
        → spread flags into each mapped CustomerJob

Fix 10: Cover job badge not shown in schedule
        → mapJobsToCards reads isCoverJob from job object

Fix 11: Job status not written back to localStorage
        → updateJobStatus also writes to cleancar_CITY-SURAT_jobs

Fix 12: Check-in not persisted to attendance records
        → handleSubmitCheckIn writes to cleancar_CITY-SURAT_attendance_records

Run: python fix_washer_p0_p1.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import shutil, datetime

FILE = r"E:\3rd June Final Deployment\cleancar-root\src\app\components\washer\WasherCoreScreensConnected.tsx"

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_p0p1_{ts}")
print(f"Backed up -> {FILE}.bak_p0p1_{ts}\n")

with open(FILE, "r", encoding="utf-8") as fh:
    c = fh.read()

results = []

def patch(old, new, label):
    global c
    if old in c:
        c = c.replace(old, new, 1)
        results.append(("OK", label))
        print(f"  [OK]   {label}")
    else:
        results.append(("SKIP", label))
        print(f"  [SKIP] {label}")

# =============================================================================
# FIX 9 — Add computePeriodicFlagsB import + call in job mapping
# =============================================================================
print("=== FIX 9: Import computePeriodicFlagsB + call on mapped jobs ===")

patch(
    'import { mockWasherDataService } from "../../services/mockWasherDataService";\nimport type { CustomerJob } from "../../services/mockWasherDataService";',
    'import { mockWasherDataService, computePeriodicFlagsB } from "../../services/mockWasherDataService";\nimport type { CustomerJob } from "../../services/mockWasherDataService";',
    "Add computePeriodicFlagsB to mockWasherDataService import"
)

# Add periodic flags to the job mapping in the seed/load block
patch(
    '        loaded = myJobs.map((j: any) => ({ id:j.jobId, timeSlot:j.timeSlot||"06:00 AM", customerFirstName:j.customerName||"Customer", area:j.location?.area||"Surat", pinCode:j.location?.pinCode||"395001", city:j.city||"Surat", addressLine1:j.location?.addressLine1||"", vehicleCategory:j.vehicleDetails?.category||"Sedan", vehicleColor:j.vehicleDetails?.color||"White", vehicleBrand:j.vehicleDetails?.brand||"Maruti", vehicleRegistration:j.vehicleDetails?.registration||"", packageName:j.packageType||j.packageName||"EXPRESS_WASH", packageType:j.packageType||j.packageName||"EXPRESS_WASH", serviceFrequency:"Daily", subscriptionMonth:today.slice(0,7), subscriptionStartDate:j.subscriptionStartDate||"2026-01-01", jobType:j.jobType||"Regular", status:j.status||"Assigned", specialInstructions:j.serviceDetails?.specialInstructions||"", parkingInstructions:j.parkingInstructions||"", isCoverJob:j.isCoverJob||false, serviceDetails:j.serviceDetails||{addOns:[]}, customerId:j.customerId||"" }));',
    '        loaded = myJobs.map((j: any) => { const periodicFlags = (() => { try { return computePeriodicFlagsB(j.jobId, j.packageType || j.packageName || "EXPRESS_WASH", j.subscriptionStartDate || "2026-01-01"); } catch(_) { return {}; } })(); return { id:j.jobId, timeSlot:j.timeSlot||"06:00 AM", customerFirstName:j.customerName||"Customer", area:j.location?.area||"Surat", pinCode:j.location?.pinCode||"395001", city:j.city||"Surat", addressLine1:j.location?.addressLine1||"", vehicleCategory:j.vehicleDetails?.category||"Sedan", vehicleColor:j.vehicleDetails?.color||"White", vehicleBrand:j.vehicleDetails?.brand||"Maruti", vehicleRegistration:j.vehicleDetails?.registration||"", packageName:j.packageType||j.packageName||"EXPRESS_WASH", packageType:j.packageType||j.packageName||"EXPRESS_WASH", serviceFrequency:"Daily", subscriptionMonth:today.slice(0,7), subscriptionStartDate:j.subscriptionStartDate||"2026-01-01", jobType:j.jobType||"Regular", status:j.status||"Assigned", specialInstructions:j.serviceDetails?.specialInstructions||"", parkingInstructions:j.parkingInstructions||"", isCoverJob:j.isCoverJob||false, serviceDetails:j.serviceDetails||{addOns:[]}, customerId:j.customerId||"", ...periodicFlags }; });',
    "Call computePeriodicFlagsB on each mapped job"
)

# =============================================================================
# FIX 10 — Cover job badge in mapJobsToCards
# =============================================================================
print("\n=== FIX 10: Cover job badge in mapJobsToCards ===")

patch(
    '      isCover: false,',
    '      isCover: (job as any).isCoverJob === true,',
    "Read isCoverJob from job object in mapJobsToCards"
)

# =============================================================================
# FIX 11 — Write job status back to localStorage
# =============================================================================
print("\n=== FIX 11: Write job status back to localStorage ===")

patch(
    """  const updateJobStatus = (jobId: string, status: CustomerJob["status"]) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));
    mockWasherDataService.updateJobStatus(jobId, status);
  };""",
    """  const updateJobStatus = (jobId: string, status: CustomerJob["status"]) => {
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
  };""",
    "Write job status back to localStorage on every update"
)

# =============================================================================
# FIX 12 — Persist check-in to attendance records
# =============================================================================
print("\n=== FIX 12: Persist check-in to attendance records ===")

patch(
    """  const handleSubmitCheckIn = () => {
    setCheckedIn(true);
    setCheckInTime(new Date());

    // Fix: start GPS tracking on check-in""",
    """  const handleSubmitCheckIn = () => {
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

    // Fix: start GPS tracking on check-in""",
    "Persist check-in to attendance records + field session"
)

with open(FILE, "w", encoding="utf-8", newline="") as fh:
    fh.write(c)

print("\n" + "="*60)
ok = sum(1 for r in results if r[0] == "OK")
sk = sum(1 for r in results if r[0] == "SKIP")
print(f"  Applied: {ok}  Skipped: {sk}")
if sk:
    for r, l in results:
        if r == "SKIP": print(f"    SKIP: {l}")
print("""
Next:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/components/washer/WasherCoreScreensConnected.tsx
  git commit -m "Washer P0/P1: periodic flags, cover badge, job status writeback, check-in persistence"
  git push origin main
""")
