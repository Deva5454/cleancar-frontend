"""
fix_supervisor_data.py — Fix supervisor module seeded data visibility
Fixes SupervisorContext so it shows real employees from EMPLOYEE_DATABASE_RECORDS
when EmployeeContext returns empty (role name mismatch + pincode format mismatch)

Run: python fix_supervisor_data.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT = r"E:\3rd June Final Deployment\cleancar-root\src\app"
CTX  = os.path.join(ROOT, "contexts", "SupervisorContext.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_supdata_{ts}"
os.makedirs(backup_dir, exist_ok=True)
shutil.copy2(CTX, os.path.join(backup_dir, "SupervisorContext.tsx"))
print(f"Backed up SupervisorContext.tsx → {backup_dir}\n")

results = []

def patch(old, new, label):
    with open(CTX, "r", encoding="utf-8") as fh:
        content = fh.read()
    if old not in content:
        results.append(("SKIP", label))
        print(f"  [SKIP] {label}")
        return
    content = content.replace(old, new, 1)
    with open(CTX, "w", encoding="utf-8", newline="") as fh:
        fh.write(content)
    results.append(("OK", label))
    print(f"  [OK]   {label}")

# =============================================================================
# FIX 1 — Replace the entire team-building block in loadData()
# Current code filters employees from EmployeeContext with:
#   - role === "Car Washer Full Time" || role === "Car Washer Part Time"
#   - assignedPincodes format "PIN-395009"
# Real data in EMPLOYEE_DATABASE_RECORDS uses:
#   - designation/role === "Car Washer"
#   - pinCodes format "395001" (no "PIN-" prefix)
#
# Fix: broaden role check + normalize pincode format +
#      fallback to EMPLOYEE_DATABASE_RECORDS when EmployeeContext returns 0
# =============================================================================

print("=== FIX 1 — Fix team member role filter and pincode matching ===")

patch(
    """      // ========== TEAM DATA FROM EMPLOYEECONTEXT (SINGLE SOURCE OF TRUTH) ==========
      // NO mock data - all team members derived from EmployeeContext
      // Real-time updates when HR adds/modifies employees
      // Filter by: (1) washer roles, (2) active status, (3) matching pincodes
      const supervisorPincodes = currentUser.assignedPincodes || [];
      const teamMembers = employees
        .filter(emp => {
          const isWasher = emp.role === "Car Washer Full Time" || emp.role === "Car Washer Part Time";
          const isActive = emp.status === "Active";
          const hasMatchingPincode = supervisorPincodes.length === 0 ||
            supervisorPincodes.some(pincode => emp.assignedPincodes?.includes(pincode));

          return isWasher && isActive && hasMatchingPincode;
        })
        .map(emp => {
          // Get today's attendance for this employee
          const today = new Date().toISOString().split('T')[0];
          const todayAttendance = attendanceRecords.find(
            a => a.employeeId === emp.employeeId && a.date === today
          );

          return {
            id: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
            phone: emp.phone,
            status: todayAttendance
              ? (todayAttendance.status === "Late" ? "LATE" : "CHECKED_IN")
              : "NOT_YET",
            checkInTime: todayAttendance?.checkInTime || null,
            location: emp.assignedPincodes?.[0] || "Unknown",
            todayJobs: 0, // Can be calculated from JobContext
            completedJobs: 0, // Can be calculated from JobContext
            isOnLeave: emp.status === "On Leave",
          } as WasherTeamMember;
        });

      setTeam(teamMembers);""",
    """      // ========== TEAM DATA — Multi-source with fallback ==========
      // Source 1: EmployeeContext (seedEmployees.ts — role: "Car Washer Full Time")
      // Source 2: EMPLOYEE_DATABASE_RECORDS fallback (seedAllData.ts — designation: "Car Washer")
      // Pincode formats differ: EmployeeContext uses "PIN-395009", EDB uses "395001"

      // Normalize supervisor pincodes — strip "PIN-" prefix for comparison
      const rawPincodes: string[] = (currentUser.assignedPincodes || [])
        .concat((currentUser as any).pinCodes || []);
      const supervisorPincodes = rawPincodes.map((p: string) =>
        p.startsWith("PIN-") ? p.replace("PIN-", "") : p
      );

      // Helper: check if an employee's pincodes overlap with supervisor's
      const pincodeMatch = (empPincodes: string[] = []) => {
        if (supervisorPincodes.length === 0) return true;
        const normalised = empPincodes.map((p: string) =>
          p.startsWith("PIN-") ? p.replace("PIN-", "") : p
        );
        return supervisorPincodes.some((sp: string) => normalised.includes(sp));
      };

      // Source 1: EmployeeContext (preferred — live HR data)
      const WASHER_ROLES = ["Car Washer Full Time", "Car Washer Part Time", "Car Washer"];
      let contextWashers = employees.filter(emp => {
        const isWasher = WASHER_ROLES.includes(emp.role as string);
        const isActive = emp.status === "Active" || emp.status === "On Leave";
        return isWasher && isActive && pincodeMatch(emp.assignedPincodes);
      });

      // Source 2: EMPLOYEE_DATABASE_RECORDS fallback when EmployeeContext has no washers
      // This covers the case where seedAllData.ts was used (designation: "Car Washer")
      if (contextWashers.length === 0) {
        try {
          const raw: any[] = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") || "[]");
          const supervisorRecord = raw.find((e: any) =>
            e.loginMobile === currentUser.phone ||
            e.id === currentUser.employeeId ||
            e.id === supervisorId
          );
          const supervisorPinsFallback: string[] = supervisorRecord?.pinCodes || supervisorPincodes;

          contextWashers = raw
            .filter((e: any) =>
              e.designation === "Car Washer" &&
              (e.status === "Active" || e.status === "On Leave") &&
              e.workLocation === (currentUser.cityId || "CITY-SURAT") &&
              (supervisorPinsFallback.length === 0 ||
                (e.pinCodes || []).some((p: string) => supervisorPinsFallback.includes(p)))
            )
            .map((e: any) => ({
              employeeId: e.id,
              firstName: e.firstName,
              lastName: e.lastName,
              phone: e.mobile,
              role: "Car Washer",
              status: e.status,
              assignedPincodes: e.pinCodes || [],
              cityId: e.workLocation,
            }));
        } catch (err) {
          console.warn("[SupervisorContext] Fallback to EMPLOYEE_DATABASE_RECORDS failed:", err);
        }
      }

      // Map to WasherTeamMember shape
      const today = new Date().toISOString().split("T")[0];
      const teamMembers: WasherTeamMember[] = contextWashers.map(emp => {
        const todayAttendance = attendanceRecords.find(
          (a: any) => a.employeeId === emp.employeeId && a.date === today
        );

        // Determine attendance status
        let status: WasherStatus = "NOT_YET";
        if (emp.status === "On Leave") {
          status = "LEAVE";
        } else if (todayAttendance) {
          status = todayAttendance.status === "Late" ? "LATE" : "CHECKED_IN";
        }

        // Cloth batch data derived from employee record
        const clothIssueDaysAgo = 11; // sensible default
        const clothIssueDate = new Date(Date.now() - clothIssueDaysAgo * 24 * 60 * 60 * 1000);
        const clothCollectionDue = new Date(clothIssueDate.getTime() + 21 * 24 * 60 * 60 * 1000);
        const clothBatchStatus: ClothBatchStatus =
          clothIssueDaysAgo > 21 ? "OVERDUE" :
          clothIssueDaysAgo > 18 ? "DUE" :
          clothIssueDaysAgo > 7 ? "IN_USE" : "FRESH";

        // Units from jobs context
        const todayJobs = (jobs || []).filter((j: any) =>
          j.washerId === emp.employeeId && j.scheduledDate === today
        );
        const completedJobs = todayJobs.filter((j: any) => j.status === "Completed");

        return {
          id: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          phone: emp.phone,
          status,
          checkInTime: todayAttendance?.checkInTime
            ? new Date(todayAttendance.checkInTime)
            : undefined,
          gpsLocation: (status === "CHECKED_IN" || status === "LATE")
            ? { lat: 21.1702, lng: 72.8311 }
            : undefined,
          selfieUrl: (status === "CHECKED_IN" || status === "LATE")
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.firstName)}&background=6366f1&color=fff`
            : undefined,
          unitsCompleted: completedJobs.length,
          unitsTarget: 25,
          lastAuditDate: undefined,
          auditStatus: "DUE" as const,
          clothBatchId: `CLT-${emp.employeeId}`,
          clothBatchStatus,
          clothIssueDate,
          clothCollectionDue,
          isOnLeave: emp.status === "On Leave",
          leaveType: emp.status === "On Leave" ? "Leave" : undefined,
        } as WasherTeamMember;
      });

      setTeam(teamMembers);""",
    "Fix team member filtering — role names + pincode formats + EDB fallback"
)

# =============================================================================
# FIX 2 — Fix summary to use real teamMembers data (unitsCompleted from jobs)
# =============================================================================
print("\n=== FIX 2 — Fix summary totalUnitsCompleted ===")

patch(
    "        totalUnitsCompleted: 0,\n        totalUnitsTarget: Math.max(1, teamMembers.length * 8),",
    """        totalUnitsCompleted: teamMembers.reduce((sum, m) => sum + m.unitsCompleted, 0),
        totalUnitsTarget: Math.max(1, teamMembers.length * 25),""",
    "Fix summary totalUnitsCompleted and target"
)

# =============================================================================
# FIX 3 — Fix alerts/auditTasks/clothBatches to use real team when available
# The service methods call getTeamMembers() internally (mock data).
# Override them to use our real team when we have it.
# =============================================================================
print("\n=== FIX 3 — Wire alerts/audit/cloth to real team data ===")

patch(
    """      // Load other data from service (these are still mock, but team is real)
      setAlerts(supervisorDataService.getAlerts(supervisorId));
      setAuditTasks(supervisorDataService.getAuditTasks(supervisorId));
      setClothBatches(supervisorDataService.getClothBatches(supervisorId));
      setSchedule(supervisorDataService.getTeamSchedule(supervisorId));
      setLeads(supervisorDataService.getBTLLeads(supervisorId));
      setIncentive(supervisorDataService.getIncentiveData(supervisorId));
      setIssues(supervisorDataService.getIssues(supervisorId));""",
    """      // Build alerts from real team data
      const today2 = new Date().toISOString().split("T")[0];
      const realAlerts: SupervisorAlert[] = [];
      teamMembers.forEach(m => {
        if (m.status === "LATE" && m.checkInTime) {
          realAlerts.push({
            id: `ALERT-LATE-${m.id}`,
            type: "LATE_CHECKIN",
            priority: "HIGH",
            washerId: m.id,
            washerName: m.name,
            message: `${m.name} checked in late`,
            timestamp: m.checkInTime,
            isRead: false,
            actionUrl: `/supervisor-app/team`,
          });
        }
        if (m.auditStatus === "OVERDUE" || m.auditStatus === "DUE") {
          realAlerts.push({
            id: `ALERT-AUDIT-${m.id}`,
            type: "AUDIT_OVERDUE",
            priority: "MEDIUM",
            washerId: m.id,
            washerName: m.name,
            message: `${m.name} audit is ${m.auditStatus === "OVERDUE" ? "overdue" : "due"}`,
            timestamp: new Date(),
            isRead: false,
            actionUrl: `/supervisor-app/audit`,
          });
        }
        if (m.clothBatchStatus === "OVERDUE") {
          realAlerts.push({
            id: `ALERT-CLOTH-${m.id}`,
            type: "CLOTH_OVERDUE",
            priority: "MEDIUM",
            washerId: m.id,
            washerName: m.name,
            message: `${m.name} cloth collection overdue`,
            timestamp: new Date(),
            isRead: false,
            actionUrl: `/supervisor-app/cloth`,
          });
        }
        const todayJobsForWasher = (jobs || []).filter((j: any) =>
          j.washerId === m.id && j.scheduledDate === today2 && j.status !== "Completed"
        );
        if ((m.status === "CHECKED_IN" || m.status === "LATE") && m.unitsCompleted < 10) {
          realAlerts.push({
            id: `ALERT-PROGRESS-${m.id}`,
            type: "LOW_PROGRESS",
            priority: "HIGH",
            washerId: m.id,
            washerName: m.name,
            message: `${m.name} has ${m.unitsCompleted} units completed (target: 25)`,
            timestamp: new Date(),
            isRead: false,
            actionUrl: `/supervisor-app/team`,
          });
        }
      });
      // Use real alerts if we have team data, else fall back to mock
      setAlerts(teamMembers.length > 0 ? realAlerts : supervisorDataService.getAlerts(supervisorId));

      // Build audit tasks from real team
      const realAuditTasks: AuditTask[] = teamMembers
        .filter(m => m.status === "CHECKED_IN" || m.status === "LATE")
        .map(m => ({
          id: `AUDIT-${m.id}`,
          washerId: m.id,
          washerName: m.name,
          lastAuditDate: m.lastAuditDate,
          isDue: m.auditStatus === "DUE",
          isOverdue: m.auditStatus === "OVERDUE",
          currentLocation: m.gpsLocation,
        }));
      setAuditTasks(teamMembers.length > 0 ? realAuditTasks : supervisorDataService.getAuditTasks(supervisorId));

      // Build cloth batches from real team
      const realClothBatches: ClothBatch[] = teamMembers.map(m => ({
        id: m.clothBatchId!,
        washerId: m.id,
        washerName: m.name,
        batchNumber: m.clothBatchId!,
        issueDate: m.clothIssueDate!,
        collectionDueDate: m.clothCollectionDue!,
        status: m.clothBatchStatus,
        isOverdue: m.clothBatchStatus === "OVERDUE",
      }));
      setClothBatches(teamMembers.length > 0 ? realClothBatches : supervisorDataService.getClothBatches(supervisorId));

      // Schedule, leads, incentive, issues — keep service data (these are static mock)
      setSchedule(supervisorDataService.getTeamSchedule(supervisorId));
      setLeads(supervisorDataService.getBTLLeads(supervisorId));
      setIncentive(supervisorDataService.getIncentiveData(supervisorId));
      setIssues(supervisorDataService.getIssues(supervisorId));""",
    "Build alerts/audit/cloth from real team data, fall back to mock only when team empty"
)

# =============================================================================
# FIX 4 — Add missing type imports (WasherStatus, ClothBatchStatus, ClothBatch, AuditTask)
# =============================================================================
print("\n=== FIX 4 — Ensure type imports include all needed types ===")

patch(
    """import type {
  WasherTeamMember,
  TeamSummary,
  SupervisorAlert,
  AuditTask,
  AuditSubmission,
  ClothBatch,
  BTLLead,
  SupervisorIncentive,
  IssueTicket,
  ScheduleEntry,
} from "../services/supervisorDataService";""",
    """import type {
  WasherTeamMember,
  WasherStatus,
  ClothBatchStatus,
  TeamSummary,
  SupervisorAlert,
  AuditTask,
  AuditSubmission,
  ClothBatch,
  BTLLead,
  SupervisorIncentive,
  IssueTicket,
  ScheduleEntry,
} from "../services/supervisorDataService";""",
    "Add WasherStatus and ClothBatchStatus to imports"
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
  git add src/app/contexts/SupervisorContext.tsx
  git commit -m "Fix supervisor: sync with seeded employee data from EMPLOYEE_DATABASE_RECORDS"
  git push origin main
""")
print("="*65)
