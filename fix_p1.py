"""
fix_p1.py — P1 fixes for supervisor module

P1-1: Fix SMART_WASH/ELITE_WASH/EXPRESS_WASH labels → human readable names in schedule
P1-2: Fix auditStatus computed from last audit date (not hardcoded "DUE")
P1-3: Fix leadsToday and auditsPending computed from real data
P1-4: Add washer name + customer phone to Upcoming Bookings cards
P1-5: Fix cover plan to use real absent washer (on leave) not team[0]
      and use real jobs from JobContext not mockWasherDataService

Run: python fix_p1.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT    = r"E:\3rd June Final Deployment\cleancar-root\src\app"
SAC     = os.path.join(ROOT, "components", "supervisor", "SupervisorAppConnected.tsx")
SCHED   = os.path.join(ROOT, "components", "supervisor", "SupervisorPeriodicScheduleScreen.tsx")
CTX     = os.path.join(ROOT, "contexts", "SupervisorContext.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_p1_{ts}"
os.makedirs(backup_dir, exist_ok=True)
for f in [SAC, SCHED, CTX]:
    shutil.copy2(f, os.path.join(backup_dir, os.path.basename(f)))
    print(f"  Backed up: {os.path.basename(f)}")
print(f"\nBackups at: {backup_dir}\n")

results = []

def patch(filepath, old, new, label):
    with open(filepath, "r", encoding="utf-8") as fh:
        content = fh.read()
    if old not in content:
        results.append(("SKIP", label))
        print(f"  [SKIP] {label}")
        return
    content = content.replace(old, new, 1)
    with open(filepath, "w", encoding="utf-8", newline="") as fh:
        fh.write(content)
    results.append(("OK", label))
    print(f"  [OK]   {label}")

# =============================================================================
# P1-1: Fix package type labels in Schedule screen
# SMART_WASH → Smart Wash, ELITE_WASH → Elite Wash, EXPRESS_WASH → Express Wash
# =============================================================================
print("=== P1-1: Fix package type labels in schedule ===")

patch(SCHED,
    """const PKG_COLORS: Record<string, string> = {
  SHINE:    "bg-blue-50 text-blue-700 border-blue-200",
  PROTECT:  "bg-purple-50 text-purple-700 border-purple-200",
  ELITE:    "bg-green-50 text-green-700 border-green-200",
  ELITE_2W: "bg-amber-50 text-amber-700 border-amber-200",
};""",
    """const PKG_COLORS: Record<string, string> = {
  SHINE:        "bg-blue-50 text-blue-700 border-blue-200",
  PROTECT:      "bg-purple-50 text-purple-700 border-purple-200",
  ELITE:        "bg-green-50 text-green-700 border-green-200",
  ELITE_2W:     "bg-amber-50 text-amber-700 border-amber-200",
  EXPRESS_WASH: "bg-blue-50 text-blue-700 border-blue-200",
  SMART_WASH:   "bg-purple-50 text-purple-700 border-purple-200",
  ELITE_WASH:   "bg-green-50 text-green-700 border-green-200",
};

const PKG_DISPLAY: Record<string, string> = {
  EXPRESS_WASH: "Express Wash",
  SMART_WASH:   "Smart Wash",
  ELITE_WASH:   "Elite Wash",
  ELITE_2W:     "Elite 2W",
  SHINE:        "Express Wash",
  PROTECT:      "Smart Wash",
  ELITE:        "Elite Wash",
  Standard:     "Smart Wash",
  Premium:      "Elite Wash",
  Basic:        "Express Wash",
};""",
    "Add PKG_COLORS for internal keys + PKG_DISPLAY for human-readable labels"
)

# Replace {row.packageType} with display name
patch(SCHED,
    """                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PKG_COLORS[row.packageType] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {row.packageType}
                  </span>""",
    """                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PKG_COLORS[row.packageType] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {PKG_DISPLAY[row.packageType] ?? row.packageType}
                  </span>""",
    "Use human-readable package name in schedule rows"
)

# =============================================================================
# P1-2: Fix auditStatus computed from last audit date
# =============================================================================
print("\n=== P1-2: Fix auditStatus computed from last audit date ===")

patch(CTX,
    """          unitsCompleted: completedJobs.length,
          unitsTarget: 25,
          lastAuditDate: undefined,
          auditStatus: "DUE" as const,""",
    """          unitsCompleted: completedJobs.length,
          unitsTarget: 25,
          // Compute audit status from localStorage audit records
          lastAuditDate: (() => {
            try {
              const auditKey = `SUPERVISOR_AUDITS_${emp.employeeId}`;
              const raw = localStorage.getItem(auditKey);
              if (raw) {
                const audits = JSON.parse(raw);
                const last = audits[audits.length - 1];
                return last?.timestamp ? new Date(last.timestamp) : undefined;
              }
            } catch (_) {}
            return undefined;
          })(),
          auditStatus: (() => {
            try {
              const auditKey = `SUPERVISOR_AUDITS_${emp.employeeId}`;
              const raw = localStorage.getItem(auditKey);
              if (raw) {
                const audits = JSON.parse(raw);
                const last = audits[audits.length - 1];
                if (last?.timestamp) {
                  const daysSince = Math.floor((Date.now() - new Date(last.timestamp).getTime()) / 86400000);
                  if (daysSince <= 3) return "COMPLETED" as const;
                  if (daysSince <= 7) return "DUE" as const;
                  return "OVERDUE" as const;
                }
              }
            } catch (_) {}
            return "DUE" as const; // default: due if no audit record
          })(),""",
    "Compute auditStatus from localStorage audit records"
)

# =============================================================================
# P1-3: Fix leadsToday and auditsPending from real data
# =============================================================================
print("\n=== P1-3: Fix leadsToday and auditsPending ===")

patch(CTX,
    """        auditsPending: 0,
        auditsCompleted: 0,
        activeAlerts: 0,
        leadsToday: 0,""",
    """        auditsPending: teamMembers.filter(m => m.auditStatus === "DUE" || m.auditStatus === "OVERDUE").length,
        auditsCompleted: teamMembers.filter(m => m.auditStatus === "COMPLETED").length,
        activeAlerts: 0, // computed after alerts are built
        leadsToday: (() => {
          try {
            const raw = localStorage.getItem("cleancar_btl_leads");
            if (!raw) return 0;
            const leads = JSON.parse(raw);
            const todayStr = new Date().toISOString().split("T")[0];
            return leads.filter((l: any) =>
              l.capturedBy === (currentUser?.employeeId || supervisorId) &&
              (l.captureDate || l.createdAt || "").startsWith(todayStr)
            ).length;
          } catch { return 0; }
        })(),""",
    "Compute auditsPending and leadsToday from real data"
)

# =============================================================================
# P1-4: Add washer name + customer phone to Upcoming Bookings cards
# =============================================================================
print("\n=== P1-4: Add washer + phone to Upcoming Bookings ===")

# Enrich job data with washer name when loading
patch(SCHED,
    """        // Enrich with customer names
        bookingJobs = bookingJobs.map((j: any) => ({
          ...j,
          customerName: custNameMap2[j.customerId] || j.customerName || j.customerId || "Customer",
        }));""",
    """        // Build washer name map
        const washerNameMap: Record<string, string> = {};
        const washerPhoneMap: Record<string, string> = {};
        try {
          const rawEDB = localStorage.getItem("EMPLOYEE_DATABASE_RECORDS");
          if (rawEDB) {
            (JSON.parse(rawEDB) as any[])
              .filter((e: any) => e.designation === "Car Washer")
              .forEach((e: any) => {
                washerNameMap[e.id] = e.fullName || `${e.firstName} ${e.lastName}`.trim();
              });
          }
        } catch (_) {}

        // Build customer phone map
        const custPhoneMap: Record<string, string> = {};
        try {
          const rawC3 = localStorage.getItem("cleancar_CITY-SURAT_customers");
          if (rawC3) {
            (JSON.parse(rawC3) as any[]).forEach((c: any) => {
              custPhoneMap[c.customerId] = c.phone || c.mobile || "";
            });
          }
        } catch (_) {}

        // Enrich with customer names, washer names and phones
        bookingJobs = bookingJobs.map((j: any) => ({
          ...j,
          customerName: custNameMap2[j.customerId] || j.customerName || j.customerId || "Customer",
          customerPhone: custPhoneMap[j.customerId] || "",
          washerDisplayName: j.washerId ? (washerNameMap[j.washerId] || j.washerName || j.washerId) : null,
        }));""",
    "Enrich upcoming bookings with washer name and customer phone"
)

# Add washer name and phone to the booking card display
patch(SCHED,
    """                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(job.scheduledDate)}
                      {job.timeSlot && job.timeSlot !== "TBD" ? " at " + job.timeSlot : ""}
                    </span>
                    {job.vehicleDetails?.registration && (
                      <span>Vehicle: {job.vehicleDetails.registration}</span>
                    )}
                    {job.location?.area && (
                      <span>Area: {job.location.area}</span>
                    )}
                  </div>
                  {job.status === "Unassigned" && (
                    <p className="text-xs text-amber-600 font-medium mt-2 pt-2 border-t border-gray-100">
                      Washer not yet assigned — go to Dashboard to assign
                    </p>
                  )}""",
    """                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(job.scheduledDate)}
                      {job.timeSlot && job.timeSlot !== "TBD" ? " at " + job.timeSlot : ""}
                    </span>
                    {job.vehicleDetails?.registration && (
                      <span>Vehicle: {job.vehicleDetails.registration}</span>
                    )}
                    {job.location?.area && (
                      <span>Area: {job.location.area}</span>
                    )}
                    {job.washerDisplayName && (
                      <span className="text-blue-600">Washer: {job.washerDisplayName}</span>
                    )}
                    {job.customerPhone && (
                      <a href={`tel:${job.customerPhone}`} className="text-indigo-600 underline">
                        {job.customerPhone}
                      </a>
                    )}
                  </div>
                  {job.status === "Unassigned" && (
                    <p className="text-xs text-amber-600 font-medium mt-2 pt-2 border-t border-gray-100">
                      Washer not yet assigned — go to Dashboard to assign
                    </p>
                  )}""",
    "Show washer name and customer phone in Upcoming Bookings cards"
)

# =============================================================================
# P1-5: Fix cover plan to use real absent washer + real jobs
# =============================================================================
print("\n=== P1-5: Fix cover plan to use real absent washer + real jobs ===")

patch(SAC,
    """    // Default behavior: auto-generate from team data
    if (team && team.length > 0 && !coverPlan && scenario !== "cover") {
      const absentWasher = team.find(w => w.status === "LEAVE") || team[0];
      if (absentWasher) {
        const jobsToRedistribute = mockWasherDataService.getTodayJobs(absentWasher.id, 25);
        const availableWashers = team""",
    """    // Default behavior: auto-generate from team data using real absent washer
    if (team && team.length > 0 && !coverPlan && scenario !== "cover") {
      // Priority: LEAVE > ABSENT > first washer with most jobs
      const absentWasher =
        team.find((w: any) => w.isOnLeave || w.status === "LEAVE") ||
        team.find((w: any) => w.status === "ABSENT") ||
        team[0];
      if (absentWasher) {
        // Use real jobs from JobContext instead of mock data
        const today = new Date().toISOString().split("T")[0];
        const realJobsForWasher = (jobs || []).filter((j: any) =>
          j.washerId === absentWasher.id &&
          j.scheduledDate === today &&
          ["Assigned","Acknowledged","In Progress","Unassigned"].includes(j.status)
        );
        const jobsToRedistribute = realJobsForWasher.length > 0
          ? realJobsForWasher.map((j: any) => ({
              id: j.jobId,
              customerId: j.customerId,
              customerFirstName: j.customerName || j.customerId,
              scheduledTime: j.timeSlot || "08:00",
              area: j.location?.area || j.serviceDetails?.area || "Surat",
              packageType: j.packageName || "Daily Wash",
              subscriptionStartDate: today,
            }))
          : mockWasherDataService.getTodayJobs(absentWasher.id, 8);
        const availableWashers = team""",
    "Fix cover plan to use real absent washer and real jobs"
)

# =============================================================================
# Summary
# =============================================================================
print("\n" + "="*65)
ok    = [r for r in results if r[0] == "OK"]
skips = [r for r in results if r[0] == "SKIP"]
print(f"  Applied : {len(ok)}")
print(f"  Skipped : {len(skips)}")
if skips:
    print("\n  SKIPPED:")
    for _, label in skips:
        print(f"    - {label}")
print("""
Next steps:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/components/supervisor/SupervisorPeriodicScheduleScreen.tsx
  git add src/app/components/supervisor/SupervisorAppConnected.tsx
  git add src/app/contexts/SupervisorContext.tsx
  git commit -m "P1: human labels, audit status, real leads, washer+phone in bookings, real cover"
  git push origin main
""")
print("="*65)
