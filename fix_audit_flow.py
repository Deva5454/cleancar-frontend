"""
fix_audit_flow.py — Install new AuditFlowScreen and wire into SupervisorAppConnected

1. Copy AuditFlowScreen.tsx to supervisor components folder
2. Update import in SupervisorAppConnected to use new component
3. Pass new props (washerGPS, washerSelfieUrl, supervisorId, supervisorName)
4. Update handleStartAudit to open new flow

Run: python fix_audit_flow.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT      = r"E:\3rd June Final Deployment\cleancar-root\src\app"
SAC       = os.path.join(ROOT, "components", "supervisor", "SupervisorAppConnected.tsx")
NEW_SCREEN = os.path.join(ROOT, "components", "supervisor", "AuditFlowScreen.tsx")
SOURCE    = r"C:\Users\{USERNAME}\Downloads\AuditFlowScreen.tsx"

import os
username = os.environ.get("USERNAME", "User")
SOURCE   = rf"C:\Users\{username}\Downloads\AuditFlowScreen.tsx"

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_auditflow_{ts}"
os.makedirs(backup_dir, exist_ok=True)
shutil.copy2(SAC, os.path.join(backup_dir, "SupervisorAppConnected.tsx"))
print(f"Backed up SupervisorAppConnected.tsx -> {backup_dir}\n")

# Copy new component
if os.path.exists(SOURCE):
    shutil.copy2(SOURCE, NEW_SCREEN)
    print(f"[OK] Copied AuditFlowScreen.tsx to supervisor components")
else:
    print(f"[ERR] AuditFlowScreen.tsx not found at {SOURCE}")
    print("      Please manually copy it to:")
    print(f"      {NEW_SCREEN}")

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
# FIX 1 — Update import to use new AuditFlowScreen
# =============================================================================
print("\n=== FIX 1: Update import ===")

patch(SAC,
    'import { FieldAuditScreen, AuditFlowScreen, AuditResultScreen } from "./FieldAuditScreen";',
    'import { FieldAuditScreen, AuditResultScreen } from "./FieldAuditScreen";\nimport { AuditFlowScreen } from "./AuditFlowScreen";',
    "Update import to use new AuditFlowScreen"
)

# =============================================================================
# FIX 2 — Update auditFlow state to include new fields
# =============================================================================
print("\n=== FIX 2: Update auditFlow state ===")

patch(SAC,
    """  const [auditFlow, setAuditFlow] = useState<{
    active: boolean;""",
    """  const [auditFlow, setAuditFlow] = useState<{
    active: boolean;
    washerGPS?: { lat: number; lng: number };
    washerSelfieUrl?: string;""",
    "Add washerGPS and washerSelfieUrl to auditFlow state"
)

# =============================================================================
# FIX 3 — Update handleStartAudit to pass GPS + selfie
# =============================================================================
print("\n=== FIX 3: Update handleStartAudit ===")

patch(SAC,
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
    """    // Determine package type from the washer's current job
    const today = new Date().toISOString().split("T")[0];
    const washerJob = (jobs || []).find((j: any) =>
      j.washerId === washer.id &&
      j.scheduledDate === today &&
      ["Assigned", "Acknowledged", "In Progress"].includes(j.status)
    );
    const detectedPackage = washerJob?.packageType || washerJob?.packageName || "SMART_WASH";

    setAuditFlow({
      active: true,
      washerId: washer.id,
      washerName: washer.name,
      washerGPS: washer.gpsLocation,
      washerSelfieUrl: washer.selfieUrl,
      checklist,
      photos: 0,
      gpsValid: gpsValidation.isValid,
      gpsDistance: gpsValidation.distanceMeters,
      packageType: detectedPackage,
    });""",
    "Pass washerGPS and washerSelfieUrl to auditFlow"
)

# =============================================================================
# FIX 4 — Replace AuditFlowScreen render in TabsContent with new component
# =============================================================================
print("\n=== FIX 4: Update AuditFlowScreen render calls ===")

# Inline render (inside dashboard TabsContent)
patch(SAC,
    '              <AuditFlowScreen washerId={auditFlow.washerId} washerName={auditFlow.washerName} packageType={(auditFlow as any).packageType || "SHAMPOO_WASH"} checklist={auditFlow.checklist}',
    '              <AuditFlowScreen washerId={auditFlow.washerId} washerName={auditFlow.washerName} washerGPS={(auditFlow as any).washerGPS} washerSelfieUrl={(auditFlow as any).washerSelfieUrl} packageType={(auditFlow as any).packageType || "SMART_WASH"} supervisorId={currentUser?.employeeId || "EDB-SUP-SUR1"} supervisorName={currentUser?.name || "Supervisor"}',
    "Add new props to inline AuditFlowScreen"
)

# Tab render (inside audit-flow TabsContent)
patch(SAC,
    '                packageType={(auditFlow as any).packageType || "SHAMPOO_WASH"}\n                checklist={auditFlow.checklist}',
    '                packageType={(auditFlow as any).packageType || "SMART_WASH"}\n                washerGPS={(auditFlow as any).washerGPS}\n                washerSelfieUrl={(auditFlow as any).washerSelfieUrl}\n                supervisorId={currentUser?.employeeId || "EDB-SUP-SUR1"}\n                supervisorName={currentUser?.name || "Supervisor"}\n                checklist={auditFlow.checklist}',
    "Add new props to tab AuditFlowScreen"
)

# =============================================================================
# FIX 5 — Update handleSubmitAudit to handle new submission format
# =============================================================================
print("\n=== FIX 5: Update handleSubmitAudit ===")

patch(SAC,
    """  const handleSubmitAudit = () => {
    if (!auditFlow) return;

    const score = fieldAuditService.calculateScore(auditFlow.checklist);""",
    """  const handleSubmitAudit = (enhancedSubmission?: any) => {
    if (!auditFlow) return;

    // If new enhanced submission format received, use it directly
    if (enhancedSubmission && enhancedSubmission.score !== undefined) {
      const { score, result, flags, washerId, washerName } = enhancedSubmission;
      toast.success(`Audit submitted — ${score}/100 (${result})`);
      if (flags?.length > 0) {
        toast.warning(`${flags.length} flag(s) recorded`);
      }
      setAuditFlow(null);
      return;
    }

    const score = fieldAuditService.calculateScore(auditFlow.checklist);""",
    "Handle new enhanced submission format in handleSubmitAudit"
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
print(f"""
MANUAL STEP REQUIRED:
  Copy AuditFlowScreen.tsx to:
  E:\\3rd June Final Deployment\\cleancar-root\\src\\app\\components\\supervisor\\AuditFlowScreen.tsx

Then:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/components/supervisor/AuditFlowScreen.tsx
  git add src/app/components/supervisor/SupervisorAppConnected.tsx
  git commit -m "New audit flow: 6-step enhanced audit with uniform/customer/materials/process/video"
  git push origin main
""")
print("="*65)
