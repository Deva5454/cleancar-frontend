"""
fix_p2.py — P2 fixes for supervisor module

P2-1: GPS coordinates per washer pincode (not all same Surat point)
      Each pincode area in Surat has real lat/lng coordinates
P2-2: unitsTarget from realistic value (20/day) not hardcoded 25
P2-3: Selfie URL — try to read from field check-in session first,
      fall back to ui-avatars with correct name
P2-4: totalUnitsTarget in summary uses 20 per washer not 25

Run: python fix_p2.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT = r"E:\3rd June Final Deployment\cleancar-root\src\app"
CTX  = os.path.join(ROOT, "contexts", "SupervisorContext.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_p2_{ts}"
os.makedirs(backup_dir, exist_ok=True)
shutil.copy2(CTX, os.path.join(backup_dir, "SupervisorContext.tsx"))
print(f"Backed up SupervisorContext.tsx -> {backup_dir}\n")

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
# P2-1: GPS coordinates per pincode area + P2-2: units target + P2-3: selfie
# All in the same WasherTeamMember map block
# =============================================================================
print("=== P2-1+2+3: GPS per pincode, realistic target, selfie from field session ===")

patch(CTX,
    """          gpsLocation: (status === "CHECKED_IN" || status === "LATE")
            ? { lat: 21.1702, lng: 72.8311 }
            : undefined,
          selfieUrl: (status === "CHECKED_IN" || status === "LATE")
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.firstName)}&background=6366f1&color=fff`
            : undefined,
          unitsCompleted: completedJobs.length,
          unitsTarget: 25,""",
    """          gpsLocation: (status === "CHECKED_IN" || status === "LATE")
            ? (() => {
                // Map pincode to approximate GPS coordinates for Surat areas
                const PINCODE_GPS: Record<string, { lat: number; lng: number }> = {
                  "395001": { lat: 21.1959, lng: 72.8302 }, // Adajan
                  "395002": { lat: 21.1702, lng: 72.8311 }, // Surat city centre
                  "395003": { lat: 21.2095, lng: 72.8365 }, // Katargam
                  "395004": { lat: 21.1551, lng: 72.7924 }, // Bhatar
                  "395005": { lat: 21.1667, lng: 72.8417 }, // Nanpura
                  "395006": { lat: 21.1458, lng: 72.8208 }, // Udhna
                  "395007": { lat: 21.1384, lng: 72.7842 }, // Vesu
                  "395008": { lat: 21.2221, lng: 72.8463 }, // Sachin
                  "395009": { lat: 21.1783, lng: 72.7942 }, // Piplod
                  "395010": { lat: 21.1602, lng: 72.7683 }, // Althan
                  "PIN-395001": { lat: 21.1959, lng: 72.8302 },
                  "PIN-395002": { lat: 21.1702, lng: 72.8311 },
                  "PIN-395007": { lat: 21.1384, lng: 72.7842 },
                  "PIN-395009": { lat: 21.1783, lng: 72.7942 },
                };
                const pin = (emp.assignedPincodes || [])[0] || (emp as any).pinCodes?.[0] || "395001";
                const base = PINCODE_GPS[pin] || { lat: 21.1702, lng: 72.8311 };
                // Small jitter so washers in same pincode don't overlap on map
                const idx = teamMembers.length; // approximate index
                return {
                  lat: base.lat + (Math.sin(idx * 1.7) * 0.002),
                  lng: base.lng + (Math.cos(idx * 1.7) * 0.002),
                };
              })()
            : undefined,
          selfieUrl: (status === "CHECKED_IN" || status === "LATE")
            ? (() => {
                // Try to read real selfie from FieldCheckIn session
                try {
                  const sessionKey = `field_checkin_session_${emp.employeeId}`;
                  const raw = localStorage.getItem(sessionKey);
                  if (raw) {
                    const session = JSON.parse(raw);
                    if (session.checkInSelfieBase64) return session.checkInSelfieBase64;
                  }
                  // Also try today's session
                  const todayKey = `field_session_${emp.employeeId}_${new Date().toISOString().split("T")[0]}`;
                  const rawToday = localStorage.getItem(todayKey);
                  if (rawToday) {
                    const session = JSON.parse(rawToday);
                    if (session.checkInSelfieBase64) return session.checkInSelfieBase64;
                  }
                } catch (_) {}
                // Fall back to avatar with correct name and department colour
                return `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.firstName + "+" + emp.lastName)}&background=0d9488&color=fff&bold=true&size=128`;
              })()
            : undefined,
          unitsCompleted: completedJobs.length,
          unitsTarget: 20, // Realistic daily target: 20 cars/washer""",
    "P2-1+2+3: GPS per pincode area, realistic target 20, selfie from field session"
)

# =============================================================================
# P2-4: totalUnitsTarget in summary uses 20 per washer
# =============================================================================
print("\n=== P2-4: Fix totalUnitsTarget in summary ===")

patch(CTX,
    "        totalUnitsTarget: Math.max(1, teamMembers.length * 25),",
    "        totalUnitsTarget: Math.max(1, teamMembers.length * 20), // 20 cars/washer/day (realistic)",
    "Fix totalUnitsTarget to use 20 per washer"
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
  git commit -m "P2: GPS per pincode area, units target 20, selfie from field session"
  git push origin main
""")
print("="*65)
