"""
fix_supervisor.py — 249 Carwashing Supervisor Module Fixes
Fixes all P0 + P1 gaps identified in the audit:

P0:
  1. System alerts bell — make clickable (navigates to alerts tab)
  2. Schedule tab — wire SupervisorPeriodicScheduleScreen instead of empty stub
  3. Issues tab — swap EscalationScreenSimple for full EscalationScreen with all props
  4. Add missing TabsTriggers: cover, audit-trail, kpi-dashboard
  5. Remove debug red banner from EscalationScreenSimple

P1:
  6. Leads tab — swap BTLLeadScreenSimple for full BTLLeadScreen
  7. Fix hardcoded "SUP-001" — use currentUser.employeeId
  8. Fix hardcoded dayNumber/totalDays — compute from actual date
  9. Fix call washer — uncomment tel: link
  10. Fix all prompt()/confirm() escalation handlers — replace with modal state
  11. Fix handleViewDetailsFromAlert — add navigation logic
  12. Fix mock car data — use real jobs from context
  13. Fix audit packageType hardcoded SHAMPOO_WASH
  14. Add loading state to job assign button
  15. Fix duplicate TabsList — visibility trigger was in row 2 already, add cover/audit-trail/kpi-dashboard

Run: python fix_supervisor.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT  = r"E:\3rd June Final Deployment\cleancar-root\src\app"
SAC   = os.path.join(ROOT, "components", "supervisor", "SupervisorAppConnected.tsx")
ESS   = os.path.join(ROOT, "components", "supervisor", "EscalationScreenSimple.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_sup_{ts}"
os.makedirs(backup_dir, exist_ok=True)
for f in [SAC, ESS]:
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
# FIX 1 — Add import for SupervisorPeriodicScheduleScreen + EscalationScreen
# =============================================================================
print("=== FIX 1 — Add missing imports ===")

patch(SAC,
    'import { DailyFlowScreen } from "./DailyFlowScreen";',
    'import { DailyFlowScreen } from "./DailyFlowScreen";\nimport { SupervisorPeriodicScheduleScreen } from "./SupervisorPeriodicScheduleScreen";',
    "Import SupervisorPeriodicScheduleScreen"
)

# EscalationScreen is already imported at line 23 but not used — just verify
patch(SAC,
    'import { EscalationScreen } from "./EscalationScreen";',
    'import { EscalationScreen } from "./EscalationScreen"; // full version',
    "Mark EscalationScreen import as full version"
)

# =============================================================================
# FIX 2 — Add modal state for escalation actions (replaces all prompt/confirm)
# =============================================================================
print("\n=== FIX 2 — Add escalation modal state ===")

patch(SAC,
    "  // Auto-assign cars handlers\n  const [autoAssignModalOpen, setAutoAssignModalOpen] = useState(false);",
    """  // ── Escalation modal state (replaces prompt/confirm) ──────────────────────
  const [escalationModal, setEscalationModal] = useState<{
    type: string;
    title: string;
    fields: { key: string; label: string; type?: string; options?: string[] }[];
    data: Record<string, string>;
    onSubmit: (data: Record<string, string>) => void;
  } | null>(null);

  const openEscalationModal = (
    type: string,
    title: string,
    fields: { key: string; label: string; type?: string; options?: string[] }[],
    onSubmit: (data: Record<string, string>) => void
  ) => {
    const data: Record<string, string> = {};
    fields.forEach(f => { data[f.key] = ""; });
    setEscalationModal({ type, title, fields, data, onSubmit });
  };

  // Auto-assign cars handlers
  const [autoAssignModalOpen, setAutoAssignModalOpen] = useState(false);""",
    "Add escalation modal state"
)

# =============================================================================
# FIX 3 — Replace all prompt()/confirm() escalation handlers with modal calls
# =============================================================================
print("\n=== FIX 3 — Replace prompt/confirm handlers ===")

# handleManualAttendanceOverride
patch(SAC,
    """  const handleManualAttendanceOverride = () => {
    const washerId = prompt("Enter Washer ID:");
    const reason = prompt("Enter reason:");
    const selfieUrl = "SELFIE_PLACEHOLDER.jpg";
    if (washerId && reason) {
      escalationService.requestAttendanceOverride(washerId, reason, selfieUrl, "SUP-001");
    }
  };""",
    """  const handleManualAttendanceOverride = () => {
    const washers = team.map(w => w.name).join("|");
    openEscalationModal("attendance_override", "Manual Attendance Override", [
      { key: "washerName", label: "Washer", type: "select", options: team.map(w => w.name) },
      { key: "reason", label: "Reason for override" },
    ], (data) => {
      const washer = team.find(w => w.name === data.washerName);
      if (washer && data.reason) {
        escalationService.requestAttendanceOverride(washer.id, data.reason, "", currentUser?.employeeId || "SUP-001");
        toast.success(`Attendance override submitted for ${washer.name}`);
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handleManualAttendanceOverride prompt with modal"
)

# handleForceEarlyCheckout
patch(SAC,
    """  const handleForceEarlyCheckout = (washerId: string) => {
    if (confirm(`Force early checkout for ${washerId}?`)) {
      escalationService.forceEarlyCheckOut(washerId, "SUP-001");
    }
  };""",
    """  const handleForceEarlyCheckout = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);
    openEscalationModal("force_checkout", `Force Early Checkout — ${washer?.name || washerId}`, [
      { key: "reason", label: "Reason for early checkout" },
    ], (data) => {
      if (data.reason) {
        escalationService.forceEarlyCheckOut(washerId, currentUser?.employeeId || "SUP-001");
        toast.success(`Early checkout processed for ${washer?.name || washerId}`);
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handleForceEarlyCheckout confirm with modal"
)

# handlePauseWasherSchedule
patch(SAC,
    """  const handlePauseWasherSchedule = (washerId: string) => {
    const reason = prompt("Enter reason for pausing schedule:");
    if (reason) {
      escalationService.pauseWasherSchedule(washerId, reason, "SUP-001");
    }
  };""",
    """  const handlePauseWasherSchedule = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);
    openEscalationModal("pause_schedule", `Pause Schedule — ${washer?.name || washerId}`, [
      { key: "reason", label: "Reason for pausing schedule" },
    ], (data) => {
      if (data.reason) {
        escalationService.pauseWasherSchedule(washerId, data.reason, currentUser?.employeeId || "SUP-001");
        toast.success(`Schedule paused for ${washer?.name || washerId}`);
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handlePauseWasherSchedule prompt with modal"
)

# handleVehicleDamageEscalation
patch(SAC,
    """  const handleVehicleDamageEscalation = () => {
    const washerId = prompt("Enter Washer ID:");
    const vehicleDetails = prompt("Enter vehicle details:");
    const notes = prompt("Enter notes:");
    if (washerId && vehicleDetails && notes) {
      escalationService.escalateVehicleDamage(
        washerId,
        vehicleDetails,
        "PHOTO_PLACEHOLDER.jpg",
        notes,
        "SUP-001"
      );
    }
  };""",
    """  const handleVehicleDamageEscalation = () => {
    openEscalationModal("vehicle_damage", "Vehicle Damage Escalation", [
      { key: "washerName", label: "Washer", type: "select", options: team.map(w => w.name) },
      { key: "vehicleDetails", label: "Vehicle details (registration, model)" },
      { key: "notes", label: "Damage description" },
    ], (data) => {
      const washer = team.find(w => w.name === data.washerName);
      if (washer && data.vehicleDetails && data.notes) {
        escalationService.escalateVehicleDamage(washer.id, data.vehicleDetails, "", data.notes, currentUser?.employeeId || "SUP-001");
        toast.warning(`Vehicle damage escalation submitted for ${washer.name}`);
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handleVehicleDamageEscalation prompts with modal"
)

# handleSOSAlert
patch(SAC,
    """  const handleSOSAlert = () => {
    if (confirm("🔴 TRIGGER SOS SAFETY ALERT? This will notify all managers.")) {
      escalationService.triggerSOSAlert("SUP-001", { lat: 21.1702, lng: 72.8311 }, "Emergency");
    }
  };""",
    """  const handleSOSAlert = () => {
    openEscalationModal("sos", "🔴 SOS Safety Alert", [
      { key: "situation", label: "Describe the emergency situation" },
    ], (data) => {
      if (data.situation) {
        escalationService.triggerSOSAlert(currentUser?.employeeId || "SUP-001", { lat: 21.1702, lng: 72.8311 }, data.situation);
        toast.error(`SOS Alert triggered. All managers notified.`);
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handleSOSAlert confirm with modal"
)

# handleIncentiveOverrideRequest
patch(SAC,
    """  const handleIncentiveOverrideRequest = () => {
    const caseType = prompt("Enter case type:");
    const reason = prompt("Enter reason:");
    if (caseType && reason) {
      escalationService.requestIncentiveOverride(caseType, reason, "SUP-001");
    }
  };""",
    """  const handleIncentiveOverrideRequest = () => {
    openEscalationModal("incentive_override", "Incentive Override Request", [
      { key: "caseType", label: "Case type", type: "select", options: ["Missed visit credit", "Quality dispute", "Bonus correction", "Other"] },
      { key: "reason", label: "Reason / supporting details" },
    ], (data) => {
      if (data.caseType && data.reason) {
        escalationService.requestIncentiveOverride(data.caseType, data.reason, currentUser?.employeeId || "SUP-001");
        toast.success("Incentive override request submitted to Finance");
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handleIncentiveOverrideRequest prompts with modal"
)

# handleReassignCarAction
patch(SAC,
    """  const handleReassignCarAction = () => {
    const carId = prompt("Enter Car ID:");
    const fromWasherId = prompt("From Washer ID:");
    const toWasherId = prompt("To Washer ID:");
    const reason = prompt("Enter reason:");
    if (carId && fromWasherId && toWasherId && reason) {
      escalationService.reassignCar(carId, fromWasherId, toWasherId, reason, "SUP-001");
    }
  };""",
    """  const handleReassignCarAction = () => {
    openEscalationModal("reassign_car", "Reassign Car Between Washers", [
      { key: "fromWasherName", label: "From washer", type: "select", options: team.map(w => w.name) },
      { key: "toWasherName", label: "To washer", type: "select", options: team.map(w => w.name) },
      { key: "reason", label: "Reason for reassignment" },
    ], (data) => {
      const fromW = team.find(w => w.name === data.fromWasherName);
      const toW   = team.find(w => w.name === data.toWasherName);
      if (fromW && toW && data.reason) {
        escalationService.reassignCar("JOB", fromW.id, toW.id, data.reason, currentUser?.employeeId || "SUP-001");
        toast.success(`Car reassigned from ${fromW.name} to ${toW.name}`);
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handleReassignCarAction prompts with modal"
)

# handleBatchInvalidationAction
patch(SAC,
    """  const handleBatchInvalidationAction = () => {
    const washerId = prompt("Enter Washer ID:");
    const batchId = prompt("Enter Batch ID (A/B/C/D):");
    const reason = prompt("Enter reason:");
    if (washerId && batchId && reason) {
      escalationService.invalidateBatch(washerId, batchId, reason, "SUP-001");
    }
  };""",
    """  const handleBatchInvalidationAction = () => {
    openEscalationModal("batch_invalidation", "Cloth Batch Invalidation", [
      { key: "washerName", label: "Washer", type: "select", options: team.map(w => w.name) },
      { key: "batchId", label: "Batch ID", type: "select", options: ["A", "B", "C", "D"] },
      { key: "reason", label: "Reason for invalidation" },
    ], (data) => {
      const washer = team.find(w => w.name === data.washerName);
      if (washer && data.batchId && data.reason) {
        escalationService.invalidateBatch(washer.id, data.batchId, data.reason, currentUser?.employeeId || "SUP-001");
        toast.warning(`Batch ${data.batchId} invalidated for ${washer.name}`);
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handleBatchInvalidationAction prompts with modal"
)

# handleEscalateToOpsManager
patch(SAC,
    """  const handleEscalateToOpsManager = (issueId: string) => {
    const reason = prompt("Enter escalation reason:");
    if (reason) {
      escalationService.escalateToOpsManager(issueId, reason, "SUP-001");
    }
  };""",
    """  const handleEscalateToOpsManager = (issueId: string) => {
    openEscalationModal("escalate_ops", "Escalate to Ops Manager", [
      { key: "reason", label: "Escalation reason" },
    ], (data) => {
      if (data.reason) {
        escalationService.escalateToOpsManager(issueId, data.reason, currentUser?.employeeId || "SUP-001");
        toast.info("Escalated to Operations Manager");
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handleEscalateToOpsManager prompt with modal"
)

# handleResolveEscalationIssue
patch(SAC,
    """  const handleResolveEscalationIssue = (issueId: string) => {
    const resolution = prompt("Enter resolution notes:");
    if (resolution) {
      escalationService.resolveIssue(issueId, resolution, "SUP-001");
    }
  };""",
    """  const handleResolveEscalationIssue = (issueId: string) => {
    openEscalationModal("resolve_issue", "Resolve Issue", [
      { key: "resolution", label: "Resolution notes" },
    ], (data) => {
      if (data.resolution) {
        escalationService.resolveIssue(issueId, data.resolution, currentUser?.employeeId || "SUP-001");
        toast.success("Issue resolved");
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handleResolveEscalationIssue prompt with modal"
)

# handleResolveAlert
patch(SAC,
    """  const handleResolveAlert = (alertId: string) => {
    const notes = prompt("Enter resolution notes (optional):");
    alertService.resolveAlert(alertId, "SUP-001", notes || undefined);
  };""",
    """  const handleResolveAlert = (alertId: string) => {
    openEscalationModal("resolve_alert", "Resolve Alert", [
      { key: "notes", label: "Resolution notes (optional)" },
    ], (data) => {
      alertService.resolveAlert(alertId, currentUser?.employeeId || "SUP-001", data.notes || undefined);
      toast.success("Alert resolved");
      setEscalationModal(null);
    });
  };""",
    "Replace handleResolveAlert prompt with modal"
)

# handleEscalateAlert
patch(SAC,
    """  const handleEscalateAlert = (alertId: string) => {
    const reason = prompt("Enter escalation reason:");
    if (reason) {
      alertService.escalateAlert(alertId, "SUP-001", reason);
    }
  };""",
    """  const handleEscalateAlert = (alertId: string) => {
    openEscalationModal("escalate_alert", "Escalate Alert", [
      { key: "reason", label: "Escalation reason" },
    ], (data) => {
      if (data.reason) {
        alertService.escalateAlert(alertId, currentUser?.employeeId || "SUP-001", data.reason);
        toast.info("Alert escalated to Ops Manager");
      }
      setEscalationModal(null);
    });
  };""",
    "Replace handleEscalateAlert prompt with modal"
)

# =============================================================================
# FIX 4 — Fix handleViewDetailsFromAlert (empty body)
# =============================================================================
print("\n=== FIX 4 — Fix handleViewDetailsFromAlert ===")

patch(SAC,
    """  const handleViewDetailsFromAlert = () => {
  };""",
    """  const handleViewDetailsFromAlert = (alert?: any) => {
    if (alert?.actionUrl) {
      const screen = alert.actionUrl.split("/").pop() || "dashboard";
      navigate(SCREEN_TO_PATH[screen] ?? "/supervisor-app");
    } else {
      navigate(SCREEN_TO_PATH["alerts"] ?? "/supervisor-app/alerts");
    }
  };""",
    "Fix handleViewDetailsFromAlert empty body"
)

# =============================================================================
# FIX 5 — Fix system alerts bell (not clickable)
# =============================================================================
print("\n=== FIX 5 — Make system alerts bell clickable ===")

patch(SAC,
    """              {/* System Alerts Bell */}
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadAlertsCount > 0 && (
                  <Badge
                    variant="outline"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-600 text-white border-0 text-xs"
                  >
                    {unreadAlertsCount}
                  </Badge>
                )}
              </div>""",
    """              {/* System Alerts Bell */}
              <button
                className="relative"
                onClick={() => navigate(SCREEN_TO_PATH["alerts"] ?? "/supervisor-app/alerts")}
              >
                <Bell className="h-5 w-5 text-red-600" />
                {unreadAlertsCount > 0 && (
                  <Badge
                    variant="outline"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-600 text-white border-0 text-xs"
                  >
                    {unreadAlertsCount}
                  </Badge>
                )}
              </button>""",
    "Make system alerts bell a clickable button navigating to alerts tab"
)

# =============================================================================
# FIX 6 — Fix call washer (uncomment tel: link)
# =============================================================================
print("\n=== FIX 6 — Fix call washer ===")

patch(SAC,
    """    // In production: initiate phone call or show call dialog
    if (washer?.phone) {
      // Uncomment for production: window.location.href = `tel:${washer.phone}`;
    }""",
    """    if (washer?.phone) {
      window.location.href = `tel:${washer.phone}`;
    }""",
    "Uncomment tel: link in handleCallWasher"
)

patch(SAC,
    '      toast.info(`Calling ${washer.name} at ${washer.phone || \'N/A\'}\\n\\nIn production: This would initiate a phone call.`);',
    '      toast.info(`Calling ${washer.name} at ${washer.phone || "N/A"}...`);',
    "Clean up call washer toast message"
)

# =============================================================================
# FIX 7 — Fix hardcoded dayNumber/totalDays
# =============================================================================
print("\n=== FIX 7 — Fix hardcoded day counter ===")

patch(SAC,
    """            <SupervisorDashboard
              todayDate={new Date()}
              dayNumber={15}
              totalDays={26}""",
    """            <SupervisorDashboard
              todayDate={new Date()}
              dayNumber={new Date().getDate()}
              totalDays={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}""",
    "Fix hardcoded dayNumber and totalDays to actual calendar values"
)

# =============================================================================
# FIX 8 — Fix mock car data — use real jobs from context
# =============================================================================
print("\n=== FIX 8 — Fix mock car data in getAssignedCars ===")

patch(SAC,
    """  // Mock car data for absent washer
  const getAssignedCars = (washerId: string) => {
    return [
      { carId: "CAR-001", carName: "Honda City MH12AB1234", location: "Athwalines, Surat" },
      { carId: "CAR-002", carName: "Maruti Swift GJ05CD5678", location: "Piplod, Surat" },
      { carId: "CAR-003", carName: "Hyundai i20 GJ05EF9012", location: "Adajan, Surat" },
      { carId: "CAR-004", carName: "Toyota Innova GJ05GH3456", location: "Vesu, Surat" },
    ];
  };""",
    """  // Real car data from jobs context for the absent washer
  const getAssignedCars = (washerId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const washerJobs = (jobs || []).filter((j: any) =>
      j.washerId === washerId &&
      j.scheduledDate === today &&
      ["Assigned", "Acknowledged", "In Progress"].includes(j.status)
    );
    if (washerJobs.length > 0) {
      return washerJobs.map((j: any) => ({
        carId: j.jobId,
        carName: `${j.packageName || "Wash"} — ${j.vehicleDetails?.registration || j.customerId}`,
        location: j.serviceDetails?.area || j.cityId || "Surat",
      }));
    }
    // Fallback if no real jobs found
    return [
      { carId: "CAR-001", carName: "No jobs found for this washer today", location: "Surat" },
    ];
  };""",
    "Replace mock car data with real jobs from context"
)

# Fix random washer capacity
patch(SAC,
    """  // Mock available washers with capacity
  const getAvailableWashers = () => {
    return team
      .filter(w => w.status === "CHECKED_IN" || w.status === "LATE")
      .map(w => ({
        id: w.id,
        name: w.name,
        currentCars: Math.floor(Math.random() * 3), // Simulated current cars
        maxCapacity: 5, // Max 5 cars per washer
        distanceKm: Math.random() * 10,
      }));
  };""",
    """  // Real washer capacity from jobs context
  const getAvailableWashers = () => {
    return team
      .filter(w => w.status === "CHECKED_IN" || w.status === "LATE")
      .map(w => {
        const today = new Date().toISOString().split("T")[0];
        const activeCount = (jobs || []).filter((j: any) =>
          j.washerId === w.id &&
          j.scheduledDate === today &&
          ["Assigned", "Acknowledged", "In Progress"].includes(j.status)
        ).length;
        return {
          id: w.id,
          name: w.name,
          currentCars: activeCount,
          maxCapacity: 5,
          distanceKm: 0,
        };
      });
  };""",
    "Replace random washer capacity with real active job counts"
)

# =============================================================================
# FIX 9 — Fix audit packageType hardcoded
# =============================================================================
print("\n=== FIX 9 — Fix hardcoded audit packageType ===")

patch(SAC,
    """    setAuditFlow({
      active: true,
      washerId: washer.id,
      washerName: washer.name,
      checklist,
      photos: 0,
      gpsValid: gpsValidation.isValid,
      gpsDistance: gpsValidation.distanceMeters,
    });""",
    """    // Determine package type from the washer's current job
    const today = new Date().toISOString().split("T")[0];
    const washerJob = (jobs || []).find((j: any) =>
      j.washerId === washer.id &&
      j.scheduledDate === today &&
      ["Assigned", "Acknowledged", "In Progress"].includes(j.status)
    );
    const detectedPackage = washerJob?.packageType || "SHAMPOO_WASH";

    setAuditFlow({
      active: true,
      washerId: washer.id,
      washerName: washer.name,
      checklist,
      photos: 0,
      gpsValid: gpsValidation.isValid,
      gpsDistance: gpsValidation.distanceMeters,
      packageType: detectedPackage,
    });""",
    "Detect actual packageType from washer's current job for audit"
)

patch(SAC,
    '              <AuditFlowScreen washerId={auditFlow.washerId} washerName={auditFlow.washerName} packageType="SHAMPOO_WASH" checklist={auditFlow.checklist}',
    '              <AuditFlowScreen washerId={auditFlow.washerId} washerName={auditFlow.washerName} packageType={(auditFlow as any).packageType || "SHAMPOO_WASH"} checklist={auditFlow.checklist}',
    "Use detected packageType in inline AuditFlowScreen"
)

patch(SAC,
    '                packageType="SHAMPOO_WASH"\n                checklist={auditFlow.checklist}',
    '                packageType={(auditFlow as any).packageType || "SHAMPOO_WASH"}\n                checklist={auditFlow.checklist}',
    "Use detected packageType in tab AuditFlowScreen"
)

# =============================================================================
# FIX 10 — Add loading state to job assign button
# =============================================================================
print("\n=== FIX 10 — Add loading state to assign button ===")

patch(SAC,
    "  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);\n  const [assignWasherId, setAssignWasherId] = useState<string>(\"\");",
    '  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);\n  const [assignWasherId, setAssignWasherId] = useState<string>("");\n  const [assigningInProgress, setAssigningInProgress] = useState(false);',
    "Add assigningInProgress state"
)

patch(SAC,
    """                            <button
                              onClick={() => {
                                if (assignWasherId) {
                                  const washer = team.find(w => w.id === assignWasherId);
                                  assignJobToWasher(j.jobId, assignWasherId, washer?.name || assignWasherId);
                                  toast.success(`Job assigned to ${washer?.name || assignWasherId}`);
                                  setAssigningJobId(null);
                                  setAssignWasherId("");
                                }
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-semibold"
                            >Assign</button>""",
    """                            <button
                              disabled={assigningInProgress || !assignWasherId}
                              onClick={async () => {
                                if (assignWasherId && !assigningInProgress) {
                                  setAssigningInProgress(true);
                                  const washer = team.find(w => w.id === assignWasherId);
                                  await assignJobToWasher(j.jobId, assignWasherId, washer?.name || assignWasherId);
                                  toast.success(`Job assigned to ${washer?.name || assignWasherId}`);
                                  setAssigningJobId(null);
                                  setAssignWasherId("");
                                  setAssigningInProgress(false);
                                }
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >{assigningInProgress ? "Assigning..." : "Assign"}</button>""",
    "Add loading state to assign button"
)

# =============================================================================
# FIX 11 — Wire Schedule tab to SupervisorPeriodicScheduleScreen
# =============================================================================
print("\n=== FIX 11 — Wire Schedule tab ===")

patch(SAC,
    """          {/* Screen 5: Team Schedule */}
          <TabsContent value="schedule" className="mt-0 p-4">
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-bold mb-2">Team Schedule & Cars</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {schedule.length} washers • {summary.totalUnitsCompleted} units completed
                </p>
                <p className="text-xs text-gray-500">
                  Full schedule view with job reassignment and cover management
                </p>
              </CardContent>
            </Card>
          </TabsContent>""",
    """          {/* Screen 5: Team Schedule */}
          <TabsContent value="schedule" className="mt-0">
            <SupervisorPeriodicScheduleScreen />
          </TabsContent>""",
    "Wire Schedule tab to SupervisorPeriodicScheduleScreen"
)

# =============================================================================
# FIX 12 — Swap EscalationScreenSimple for full EscalationScreen with all props
# =============================================================================
print("\n=== FIX 12 — Swap Issues tab to full EscalationScreen ===")

patch(SAC,
    """          {/* Screen 8: Issues */}
          <TabsContent value="issues" className="mt-0">
            <EscalationScreenSimple
              issues={escalationIssues}
              summary={escalationSummary}
            />
          </TabsContent>""",
    """          {/* Screen 8: Issues */}
          <TabsContent value="issues" className="mt-0">
            <EscalationScreen
              issues={escalationIssues}
              summary={escalationSummary}
              onManualOverride={handleManualAttendanceOverride}
              onForceCheckout={handleForceEarlyCheckout}
              onReassignCover={handleReassignCoverFromEscalation}
              onPauseSchedule={handlePauseWasherSchedule}
              onVehicleDamage={handleVehicleDamageEscalation}
              onSOSAlert={handleSOSAlert}
              onIncentiveOverride={handleIncentiveOverrideRequest}
              onReassignCar={handleReassignCarAction}
              onBatchInvalidation={handleBatchInvalidationAction}
              onEscalateToOps={handleEscalateToOpsManager}
              onMarkInProgress={handleMarkIssueInProgress}
              onResolveIssue={handleResolveEscalationIssue}
            />
          </TabsContent>""",
    "Swap EscalationScreenSimple for full EscalationScreen"
)

# =============================================================================
# FIX 13 — Swap BTLLeadScreenSimple for full BTLLeadScreen
# =============================================================================
print("\n=== FIX 13 — Swap Leads tab to full BTLLeadScreen ===")

patch(SAC,
    """          {/* Screen 6: BTL Leads */}
          <TabsContent value="leads" className="mt-0">
            <BTLLeadScreenSimple
              leads={btlLeads}
              metrics={leadMetrics}
              onSubmitLead={handleSubmitLeadWithParams}
              onViewPipeline={handleViewPipeline}
            />
          </TabsContent>""",
    """          {/* Screen 6: BTL Leads */}
          <TabsContent value="leads" className="mt-0">
            <BTLLeadScreen
              leads={btlLeads}
              metrics={leadMetrics}
              onSubmitLead={handleSubmitLeadWithParams}
              onViewPipeline={handleViewPipeline}
            />
          </TabsContent>""",
    "Swap BTLLeadScreenSimple for full BTLLeadScreen"
)

# =============================================================================
# FIX 14 — Add missing TabsTriggers: cover, audit-trail, kpi-dashboard
# =============================================================================
print("\n=== FIX 14 — Add missing tab triggers ===")

patch(SAC,
    """              <TabsTrigger value="visibility" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Visibility
              </TabsTrigger>
            </TabsList>""",
    """              <TabsTrigger value="visibility" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Visibility
              </TabsTrigger>
              <TabsTrigger value="cover" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Cover
              </TabsTrigger>
              <TabsTrigger value="audit-trail" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Audit Trail
              </TabsTrigger>
              <TabsTrigger value="kpi-dashboard" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                KPI
              </TabsTrigger>
            </TabsList>""",
    "Add Cover, Audit Trail, KPI Dashboard tab triggers"
)

# Also add cover and audit-trail to PATH_TO_SCREEN mapping
patch(SAC,
    '    "audit-trail":  "/supervisor-app/audit-trail",',
    '    "audit-trail":  "/supervisor-app/audit-trail",\n    "daily-flow":   "/supervisor-app/daily-flow",',
    "Add daily-flow to SCREEN_TO_PATH"
)

# =============================================================================
# FIX 15 — Add escalation modal JSX before closing </div>
# =============================================================================
print("\n=== FIX 15 — Add escalation modal JSX ===")

patch(SAC,
    """      {/* Auto-Assign Cars Modal */}
      {selectedAbsentWasher && (""",
    """      {/* Escalation Action Modal — replaces all prompt()/confirm() */}
      {escalationModal && (
        <div style={{position:"fixed",inset:0,zIndex:10001,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <div style={{background:"white",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"440px",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            <h3 style={{fontWeight:800,fontSize:"18px",marginBottom:"4px",color:"#0f172a"}}>{escalationModal.title}</h3>
            <div style={{height:2,background:"linear-gradient(90deg,#6366f1,#8b5cf6)",borderRadius:2,marginBottom:"20px"}} />
            <div style={{display:"flex",flexDirection:"column",gap:"14px",marginBottom:"20px"}}>
              {escalationModal.fields.map(field => (
                <div key={field.key}>
                  <label style={{display:"block",fontSize:"12px",fontWeight:700,color:"#475569",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{field.label}</label>
                  {field.type === "select" && field.options ? (
                    <select
                      value={escalationModal.data[field.key] || ""}
                      onChange={e => setEscalationModal(prev => prev ? {...prev, data: {...prev.data, [field.key]: e.target.value}} : null)}
                      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:"10px",padding:"10px 12px",fontSize:"14px",background:"#f8fafc",color:"#0f172a",outline:"none"}}
                    >
                      <option value="">Select...</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <textarea
                      value={escalationModal.data[field.key] || ""}
                      onChange={e => setEscalationModal(prev => prev ? {...prev, data: {...prev.data, [field.key]: e.target.value}} : null)}
                      rows={2}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:"10px",padding:"10px 12px",fontSize:"14px",background:"#f8fafc",color:"#0f172a",outline:"none",resize:"vertical",fontFamily:"inherit"}}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:"10px"}}>
              <button
                onClick={() => setEscalationModal(null)}
                style={{flex:1,padding:"12px",border:"1.5px solid #e2e8f0",borderRadius:"10px",cursor:"pointer",fontSize:"14px",fontWeight:600,color:"#475569",background:"#f8fafc"}}
              >Cancel</button>
              <button
                onClick={() => escalationModal.onSubmit(escalationModal.data)}
                style={{flex:2,padding:"12px",border:"none",borderRadius:"10px",cursor:"pointer",fontSize:"14px",fontWeight:700,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white"}}
              >Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Assign Cars Modal */}
      {selectedAbsentWasher && (""",
    "Add escalation modal JSX"
)

# =============================================================================
# FIX 16 — Remove debug red banner from EscalationScreenSimple
# (Not strictly needed now that we swapped to full screen, but clean it up)
# =============================================================================
print("\n=== FIX 16 — Clean EscalationScreenSimple debug banner ===")

patch(ESS,
    """      {/* MEGA VISIBLE DEBUG BANNER */}
      <div className="bg-red-400 border-4 border-black p-6 m-4">
        <h1 className="text-3xl font-black text-center text-white mb-2">
          ✅ ESCALATION SCREEN IS RENDERING!
        </h1>
        <div className="bg-white p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">Issues Count: {issues.length}</p>
          <p className="text-xl font-bold text-orange-600">Open Issues: {summary?.openCount || 0}</p>
        </div>
      </div>""",
    "",
    "Remove debug banner from EscalationScreenSimple"
)

patch(ESS,
    '      {/* HEADER */}\n      <div className="bg-red-600 text-white p-4">\n        <h1 className="text-xl font-bold">Escalation Control Panel</h1>\n        <p className="text-sm">Simplified Version for Testing</p>\n      </div>',
    '      {/* HEADER */}\n      <div className="bg-indigo-600 text-white p-4">\n        <h1 className="text-xl font-bold">Escalation Control Panel</h1>\n        <p className="text-sm">Issues Overview</p>\n      </div>',
    "Clean EscalationScreenSimple header"
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
  npm run build
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/components/supervisor/SupervisorAppConnected.tsx
  git add src/app/components/supervisor/EscalationScreenSimple.tsx
  git commit -m "Supervisor module: fix all P0+P1 gaps"
  git push origin main
""")
print("="*65)
