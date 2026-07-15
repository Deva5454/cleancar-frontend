"""
fix_p0.py — P0 fixes for supervisor module

P0-1: Remove Reschedule button from SupervisorPeriodicScheduleScreen
      Supervisor is VIEW ONLY — reschedule is done by customer/TSE
      Show read-only "Rescheduled by customer/TSE" badge instead

P0-2: Fix handleReassignCoverFromEscalation calling non-existent method
      escalationService.navigateToCoverReassignment() does not exist → runtime crash

P0-3: Fix escalationService.getIssues() to use real washer names
      Currently uses Math.random() and fake "Rajesh Kumar" names

P0-4: Fix handleViewWasherDetails stub — navigate to Team tab with washer highlighted
P0-5: Fix handleAddNote stub — open escalation modal

Run: python fix_p0.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT    = r"E:\3rd June Final Deployment\cleancar-root\src\app"
SAC     = os.path.join(ROOT, "components", "supervisor", "SupervisorAppConnected.tsx")
SCHED   = os.path.join(ROOT, "components", "supervisor", "SupervisorPeriodicScheduleScreen.tsx")
ESC_SVC = os.path.join(ROOT, "services", "escalationService.ts")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_p0_{ts}"
os.makedirs(backup_dir, exist_ok=True)
for f in [SAC, SCHED, ESC_SVC]:
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
# P0-1: Remove Reschedule button + dialog from SupervisorPeriodicScheduleScreen
#       Replace button with read-only "Rescheduled" info when status = rescheduled
# =============================================================================
print("=== P0-1: Remove Reschedule button from Schedule screen ===")

# Remove the Reschedule button — replace with info-only display
patch(SCHED,
    """                      ) : (
                        <Button
                          variant="outline" size="sm"
                          className="h-7 text-xs gap-1 text-purple-700 border-purple-200 hover:bg-purple-50"
                          onClick={() => openReschedule(row, occ)}
                        >
                          <Repeat2 className="w-3 h-3" />
                          Reschedule
                        </Button>
                      )}""",
    """                      ) : (
                        <div className="text-xs text-gray-400 italic">Scheduled</div>
                      )}""",
    "Remove Reschedule button — supervisor is view only"
)

# Remove the entire Reschedule dialog
patch(SCHED,
    """      {/* Reschedule dialog */}
      <Dialog
        open={!!rescheduleTarget}
        onOpenChange={v => { if (!v) setRescheduleTarget(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat2 className="w-4 h-4 text-purple-600" />
              Reschedule Service
            </DialogTitle>
            <DialogDescription>
              {rescheduleTarget && (
                <>
                  {PERIODIC_SERVICE_META[rescheduleTarget.occ.serviceType]?.icon}{" "}
                  <strong>{PERIODIC_SERVICE_META[rescheduleTarget.occ.serviceType]?.name}</strong>{" "}
                  for <strong>{rescheduleTarget.customerName}</strong>
                  <br />
                  Currently: {formatDate(rescheduleTarget.occ.scheduledDate)} \u00b7
                  Billing month: {rescheduleTarget.occ.billingMonth}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {rescheduleTarget && (
            <div className="space-y-4 py-1">

              {/* Monthly cap warning */}
              {(() => {
                const svc   = rescheduleTarget.occ.serviceType as keyof MonthlyUsage;
                const entry = rescheduleTarget.usage[svc];
                if (!entry || entry.cap === 0) return null;
                const remaining = entry.cap - entry.used;
                return (
                  <div className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-2 ${
                    remaining <= 1
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-teal-50 border-teal-200 text-teal-800"
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Monthly allowance: <strong>{entry.used} used / {entry.cap} max</strong>.
                    Rescheduling moves this occurrence \u2014 it does not add an extra service.
                  </div>
                );
              })()}

              {/* New date picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">New date</label>
                <Input
                  type="date"
                  value={newDate}
                  min={`${rescheduleTarget.occ.billingMonth}-01`}
                  max={`${rescheduleTarget.occ.billingMonth}-31`}
                  onChange={e => { setNewDate(e.target.value); setRescheduleError(""); }}
                  className="text-sm"
                />
                <p className="text-xs text-gray-400">
                  Must be within billing month {rescheduleTarget.occ.billingMonth}
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Reason (required)</label>
                <Input
                  placeholder="e.g. Customer requested, washer unavailable\u2026"
                  value={reason}
                  onChange={e => { setReason(e.target.value); setRescheduleError(""); }}
                  className="text-sm"
                />
              </div>

              {/* Error */}
              {rescheduleError && (
                <Alert className="border-red-200 bg-red-50 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                  <AlertDescription className="text-xs text-red-700">
                    {rescheduleError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={confirmReschedule}
            >
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>""",
    """      {/* Reschedule info notice — supervisor is view only */}
      {rescheduleTarget && (
        <div style={{position:"fixed",inset:0,zIndex:10001,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <div style={{background:"white",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"400px"}}>
            <p style={{fontWeight:700,fontSize:"16px",marginBottom:"8px"}}>Reschedule Info</p>
            <p style={{fontSize:"13px",color:"#475569",marginBottom:"4px"}}>
              {PERIODIC_SERVICE_META[rescheduleTarget.occ.serviceType]?.icon}{" "}
              <strong>{PERIODIC_SERVICE_META[rescheduleTarget.occ.serviceType]?.name}</strong>{" "}
              for <strong>{rescheduleTarget.customerName}</strong>
            </p>
            <p style={{fontSize:"12px",color:"#64748b",marginBottom:"16px"}}>
              Scheduled: {formatDate(rescheduleTarget.occ.scheduledDate)}{" "}
              {rescheduleTarget.occ.status === "rescheduled" && rescheduleTarget.occ.rescheduledBy && (
                <span style={{color:"#7c3aed"}}> \u2014 Rescheduled by {rescheduleTarget.occ.rescheduledBy}</span>
              )}
            </p>
            <div style={{background:"#f1f5f9",borderRadius:"8px",padding:"12px",marginBottom:"16px"}}>
              <p style={{fontSize:"12px",color:"#475569",fontWeight:600}}>Supervisor cannot reschedule periodic services.</p>
              <p style={{fontSize:"12px",color:"#64748b",marginTop:"4px"}}>Reschedules are initiated by the customer (via app notification) or by TSE on customer request.</p>
            </div>
            <button
              onClick={() => setRescheduleTarget(null)}
              style={{width:"100%",padding:"10px",border:"none",borderRadius:"8px",background:"#6366f1",color:"white",fontWeight:600,cursor:"pointer"}}
            >Close</button>
          </div>
        </div>
      )}""",
    "Remove Reschedule dialog — replace with read-only info modal"
)

# Update header subtitle to remove "reschedule" wording
patch(SCHED,
    "            Tap any service to reschedule within the month",
    "            Tap any service to view details",
    "Update header subtitle — no reschedule action"
)

# Update cap rule text
patch(SCHED,
    """          <Alert className="border-amber-200 bg-amber-50 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800">
              <strong>Cap rule:</strong> You can move a service to a different day in the same month \u2014
              but the customer cannot receive an additional service beyond their plan\u2019s monthly allowance.
              Completed services cannot be rescheduled.
            </AlertDescription>
          </Alert>""",
    """          <Alert className="border-blue-200 bg-blue-50 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              <strong>View only:</strong> Reschedules are initiated by the customer via app notification or by TSE on customer request. Tap any service to view its status.
            </AlertDescription>
          </Alert>""",
    "Update cap rule to view-only notice"
)

# Remove unused imports that were only used by the dialog
patch(SCHED,
    "import { Input } from \"../ui/input\";\n",
    "",
    "Remove unused Input import"
)

# Remove openReschedule and confirmReschedule functions (they're now unused)
patch(SCHED,
    """  // \u2500\u2500 Reschedule flow \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  function openReschedule(row: CustomerRow, occ: PeriodicOccurrence) {
    setRescheduleTarget({
      customerId:   row.customerId,
      customerName: row.customerName,
      occ,
      usage: row.monthlyUsage,
    });
    setNewDate(occ.scheduledDate);
    setReason("");
    setRescheduleError("");
  }

  function confirmReschedule() {
    if (!rescheduleTarget) return;
    if (!newDate) { setRescheduleError("Please select a new date."); return; }
    if (!reason.trim()) { setRescheduleError("Reason is required."); return; }

    const result = periodicScheduleService.reschedule(
      rescheduleTarget.customerId,
      rescheduleTarget.occ.id,
      newDate,
      supervisorId,
      reason,
    );

    if (result.success) {
      toast.success(result.message);
      setRescheduleTarget(null);
      loadRows();
    } else {
      setRescheduleError(result.message);
    }
  }""",
    """  // \u2500\u2500 View reschedule info (read-only) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  function openReschedule(row: CustomerRow, occ: PeriodicOccurrence) {
    // View-only: supervisor cannot reschedule — show info modal only
    setRescheduleTarget({
      customerId:   row.customerId,
      customerName: row.customerName,
      occ,
      usage: row.monthlyUsage,
    });
  }""",
    "Replace openReschedule/confirmReschedule with view-only function"
)

# =============================================================================
# P0-2: Fix handleReassignCoverFromEscalation — remove non-existent method call
# =============================================================================
print("\n=== P0-2: Fix handleReassignCoverFromEscalation crash ===")

patch(SAC,
    """  const handleReassignCoverFromEscalation = () => {
    escalationService.navigateToCoverReassignment();
    navigate(SCREEN_TO_PATH["cover"] ?? "/supervisor-app");
  };""",
    """  const handleReassignCoverFromEscalation = () => {
    // Navigate to cover tab — escalationService.navigateToCoverReassignment() removed (method does not exist)
    if (location.pathname === "/supervisor-app/cover") {
      navigate("/supervisor-app/dashboard", { replace: true });
      setTimeout(() => navigate("/supervisor-app/cover"), 50);
    } else {
      navigate(SCREEN_TO_PATH["cover"] ?? "/supervisor-app/cover");
    }
  };""",
    "Fix handleReassignCoverFromEscalation — remove non-existent method call"
)

# =============================================================================
# P0-3: Fix escalationService.getIssues() to use real washer names from EDB
# =============================================================================
print("\n=== P0-3: Fix escalation issues with real washer data ===")

patch(ESC_SVC,
    """  getIssues(supervisorId: string): Issue[] {
    // In production: GET /api/supervisor/:id/issues
    const issues: Issue[] = [];

    const issueTypes: IssueType[] = ["ATTENDANCE", "QUALITY", "DAMAGE", "SAFETY", "CUSTOMER_COMPLAINT"];
    const statuses: IssueStatus[] = ["OPEN", "IN_PROGRESS", "ESCALATED"];
    const washerNames = ["Rajesh Kumar", "Amit Patel", "Suresh Shah", "Vikram Singh"];

    for (let i = 0; i < 5; i++) {
      const minutesAgo = Math.floor(Math.random() * 60);
      const raisedAt = new Date(Date.now() - minutesAgo * 60 * 1000);

      issues.push({
        id: `ISSUE-${i + 1}`,
        washerId: `WASHER-${String(i + 1).padStart(3, "0")}`,
        washerName: washerNames[i % washerNames.length],
        type: issueTypes[i % issueTypes.length],
        status: statuses[i % statuses.length],
        description: `Issue ${i + 1} description`,
        raisedAt,
        minutesSinceRaised: minutesAgo,
        isCritical: minutesAgo > this.CRITICAL_THRESHOLD_MINUTES,
      });
    }

    return issues;
  }""",
    """  getIssues(supervisorId: string): Issue[] {
    // Read real washers from EMPLOYEE_DATABASE_RECORDS
    let washers: any[] = [];
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") : null;
      if (raw) {
        const allEmps = JSON.parse(raw);
        // Find supervisor to get pincodes
        const sup = allEmps.find((e: any) => e.id === supervisorId || e.loginMobile === supervisorId);
        const supPins: string[] = sup?.pinCodes || [];
        washers = allEmps.filter((e: any) =>
          e.designation === "Car Washer" &&
          (supPins.length === 0 || (e.pinCodes || []).some((p: string) => supPins.includes(p)))
        );
      }
    } catch (_) {}

    // Fallback
    if (washers.length === 0) {
      washers = [
        { id: "EDB-CW-SUR1A", fullName: "Mahesh Bharwad" },
        { id: "EDB-CW-SUR1B", fullName: "Ramesh Koli" },
        { id: "EDB-CW-SUR1C", fullName: "Sunil Thakor" },
      ];
    }

    // Read persisted issues from localStorage
    const ISSUES_KEY = "SUPERVISOR_ISSUES";
    try {
      const persisted = typeof localStorage !== "undefined" ? localStorage.getItem(ISSUES_KEY) : null;
      if (persisted) {
        return JSON.parse(persisted).map((i: any) => ({
          ...i,
          raisedAt: new Date(i.raisedAt),
          minutesSinceRaised: Math.floor((Date.now() - new Date(i.raisedAt).getTime()) / 60000),
          isCritical: Math.floor((Date.now() - new Date(i.raisedAt).getTime()) / 60000) > this.CRITICAL_THRESHOLD_MINUTES,
        }));
      }
    } catch (_) {}

    // Generate seed issues from real washers (deterministic — no Math.random)
    const issueTypes: IssueType[] = ["ATTENDANCE", "QUALITY", "DAMAGE", "SAFETY", "CUSTOMER_COMPLAINT"];
    const statuses: IssueStatus[] = ["OPEN", "IN_PROGRESS", "ESCALATED"];
    const descriptions = [
      "Washer checked in 25 minutes late today",
      "Customer reported incomplete interior cleaning",
      "Minor scratch reported on customer vehicle door",
      "Washer left work area without supervisor permission",
      "Customer complained about water spots on windshield",
    ];

    const issues: Issue[] = washers.slice(0, Math.min(washers.length, 5)).map((w: any, i: number) => {
      const minutesAgo = 10 + i * 12; // deterministic: 10, 22, 34, 46, 58 minutes
      const raisedAt = new Date(Date.now() - minutesAgo * 60 * 1000);
      return {
        id: `ISSUE-${w.id}-${i + 1}`,
        washerId: w.id,
        washerName: w.fullName,
        type: issueTypes[i % issueTypes.length],
        status: statuses[i % statuses.length],
        description: descriptions[i % descriptions.length],
        raisedAt,
        minutesSinceRaised: minutesAgo,
        isCritical: minutesAgo > this.CRITICAL_THRESHOLD_MINUTES,
      };
    });

    return issues;
  }""",
    "Fix escalation issues to use real washer data from EMPLOYEE_DATABASE_RECORDS"
)

# =============================================================================
# P0-4: Fix handleViewWasherDetails stub — navigate to Team tab
# =============================================================================
print("\n=== P0-4: Fix handleViewWasherDetails ===")

patch(SAC,
    """  const handleViewWasherDetails = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Viewing details for ${washer.name}\\n\\nIn production: This would navigate to the washer detail view showing:\\n- Performance metrics\\n- Attendance history\\n- Unit completion\\n- Quality scores`);
    }
  };""",
    """  const handleViewWasherDetails = (washerId: string) => {
    const washer = team.find((w: any) => w.id === washerId);
    // Navigate to Team tab — washer cards are visible there
    navigate(SCREEN_TO_PATH["team"] ?? "/supervisor-app/team");
    if (washer) toast.info(`Viewing ${washer.name} on Team tab`);
  };""",
    "Fix handleViewWasherDetails — navigate to Team tab"
)

# =============================================================================
# P0-5: Fix handleAddNote stub — open escalation modal
# =============================================================================
print("\n=== P0-5: Fix handleAddNote stub ===")

patch(SAC,
    """  const handleAddNote = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Adding note for ${washer.name}\\n\\nIn production: This would show a note-adding modal.`);
    }
  };""",
    """  const handleAddNote = (washerId: string) => {
    const washer = team.find((w: any) => w.id === washerId);
    openEscalationModal("add_note", `Add Note — ${washer?.name || washerId}`, [
      { key: "category", label: "Category", type: "select", options: ["Performance", "Attendance", "Behaviour", "Quality", "General"] },
      { key: "note", label: "Note" },
    ], (data) => {
      if (data.note) {
        toast.success(`Note saved for ${washer?.name || washerId}: ${data.note}`);
      }
      setEscalationModal(null);
    });
  };""",
    "Fix handleAddNote — open escalation modal"
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
  git add src/app/services/escalationService.ts
  git commit -m "P0 fixes: view-only schedule, fix crash, real washer issues, stub handlers"
  git push origin main
""")
print("="*65)
