"""
fix_cover.py — Make Cover tab fully functional

Fixes:
1. Empty cover washers at GAP shift — broaden filter from CHECKED_IN only
   to include any active washer (NOT_YET, LATE, CHECKED_IN)
2. handleContactCustomers — replace toast stub with escalation modal
3. Distance from pincode-based GPS coordinates
4. confirmAndNotify — persist to localStorage
5. Add phone numbers to cover washer cards in CoverDistributionScreen

Run: python fix_cover.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT  = r"E:\3rd June Final Deployment\cleancar-root\src\app"
SAC   = os.path.join(ROOT, "components", "supervisor", "SupervisorAppConnected.tsx")
CDS   = os.path.join(ROOT, "components", "supervisor", "CoverDistributionScreen.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_cover_{ts}"
os.makedirs(backup_dir, exist_ok=True)
for f in [SAC, CDS]:
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
# FIX 1 — Broaden available washers filter + add phone + real distance
# =============================================================================
print("=== FIX 1: Broaden available washers filter ===")

patch(SAC,
    """        const availableWashers = team
          .filter(w => w.status === "CHECKED_IN" && w.id !== absentWasher.id)
          .slice(0, 12)
          .map(w => ({ id: w.id, name: w.name, baseUnits: w.unitsCompleted, area: "Surat" }));""",
    """        // Include any active washer — not just CHECKED_IN (covers GAP shift)
        const PINCODE_GPS: Record<string, { lat: number; lng: number }> = {
          "395001": { lat: 21.1959, lng: 72.8302 },
          "395007": { lat: 21.1384, lng: 72.7842 },
          "395009": { lat: 21.1783, lng: 72.7942 },
          "PIN-395001": { lat: 21.1959, lng: 72.8302 },
          "PIN-395007": { lat: 21.1384, lng: 72.7842 },
          "PIN-395009": { lat: 21.1783, lng: 72.7942 },
        };
        const absentPin = (absentWasher as any).assignedPincodes?.[0] || "395001";
        const absentGPS = PINCODE_GPS[absentPin] || { lat: 21.1702, lng: 72.8311 };

        const availableWashers = team
          .filter((w: any) => !w.isOnLeave && w.status !== "LEAVE" && w.status !== "ABSENT" && w.id !== absentWasher.id)
          .slice(0, 12)
          .map((w: any) => {
            // Calculate approximate distance from pincode GPS
            const wPin = w.assignedPincodes?.[0] || "395001";
            const wGPS = PINCODE_GPS[wPin] || { lat: 21.1702, lng: 72.8311 };
            const distKm = Math.round(
              Math.sqrt(
                Math.pow((wGPS.lat - absentGPS.lat) * 111, 2) +
                Math.pow((wGPS.lng - absentGPS.lng) * 111, 2)
              ) * 10
            ) / 10;
            return {
              id: w.id,
              name: w.name,
              phone: w.phone || "",
              baseUnits: w.unitsCompleted || 0,
              area: wPin.replace("PIN-", ""),
              distanceKm: distKm,
            };
          });""",
    "Broaden available washers filter + real distance + phone"
)

# =============================================================================
# FIX 2 — Fix handleContactCustomers — replace toast with escalation modal
# =============================================================================
print("\n=== FIX 2: Fix handleContactCustomers ===")

patch(SAC,
    """  const handleContactCustomers = () => {
    if (!coverPlan) {
      logger.warn("No cover plan available");
      return;
    }

    coverRedistributionService.contactCustomers(coverPlan.absentWasher.jobs);

    // Visual feedback for user
    if (typeof window !== 'undefined') {
      toast.success(`Adjusting allocation for cover capacity shortage\\n\\nAbsent Washer: ${coverPlan.absentWasher.name}\\nAffected Jobs: ${coverPlan.absentWasher.jobs.length}\\nUnassigned Units: ${coverPlan.unassignedUnits.toFixed(1)}\\n\\nIn production: This would open a modal to manually adjust job allocations across available washers.`);
    }
  };""",
    """  const handleContactCustomers = () => {
    if (!coverPlan) {
      toast.error("No cover plan available");
      return;
    }
    const affected = coverPlan.absentWasher.jobs.length;
    const unassigned = coverPlan.unassignedUnits;
    openEscalationModal("adjust_allocation", `Adjust Allocation — ${coverPlan.absentWasher.name} Absent`, [
      { key: "action", label: "Action", type: "select", options: [
        "Postpone affected washes to tomorrow",
        "Redistribute to part-time washers",
        "Contact customers to reschedule",
        "Mark as service skipped today",
      ]},
      { key: "notes", label: `Notes (${affected} jobs affected, ${unassigned.toFixed(1)} unassigned units)` },
    ], (data) => {
      if (data.action) {
        coverRedistributionService.contactCustomers(coverPlan.absentWasher.jobs);
        // Persist allocation decision
        try {
          const key = "COVER_ALLOCATION_ACTIONS";
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          existing.push({
            id: `ALLOC-${Date.now()}`,
            supervisorId: currentUser?.employeeId || "SUP-001",
            absentWasherId: coverPlan.absentWasher.id,
            absentWasherName: coverPlan.absentWasher.name,
            action: data.action,
            notes: data.notes,
            affectedJobs: affected,
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem(key, JSON.stringify(existing));
        } catch (_) {}
        toast.success(`Allocation adjusted: ${data.action}`);
      }
      setEscalationModal(null);
    });
  };""",
    "Fix handleContactCustomers with escalation modal"
)

# =============================================================================
# FIX 3 — confirmAndNotify persists to localStorage
# =============================================================================
print("\n=== FIX 3: Persist confirmAndNotify ===")

patch(SAC,
    """  const handleConfirmAndNotify = () => {
    if (!coverPlan) return;
    coverRedistributionService.confirmAndNotify(coverPlan);
    setCoverPlan({ ...coverPlan, status: "NOTIFIED" });
  };""",
    """  const handleConfirmAndNotify = () => {
    if (!coverPlan) return;
    coverRedistributionService.confirmAndNotify(coverPlan);
    const notifiedPlan = { ...coverPlan, status: "NOTIFIED" as const };
    setCoverPlan(notifiedPlan);
    // Persist cover plan status
    try {
      localStorage.setItem("SUPERVISOR_COVER_PLAN", JSON.stringify({
        ...notifiedPlan,
        generatedAt: notifiedPlan.generatedAt?.toISOString?.() || new Date().toISOString(),
      }));
    } catch (_) {}
    toast.success(`Cover plan confirmed. ${coverPlan.coverWashers.length} washers notified.`);
  };""",
    "Persist confirmAndNotify to localStorage"
)

# =============================================================================
# FIX 4 — Add phone number to cover washer cards in CoverDistributionScreen
# Read phone from EMPLOYEE_DATABASE_RECORDS and show call button
# =============================================================================
print("\n=== FIX 4: Add phone to cover washer cards ===")

patch(CDS,
    """import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AlertTriangle, CheckCircle, Plus, Minus, Users, MapPin, Phone } from "lucide-react";
import type { CoverAssignmentPlan } from "../../services/coverRedistributionService";
import { ReassignCoverModal } from "./ReassignCoverModal";""",
    """import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AlertTriangle, CheckCircle, Plus, Minus, Users, MapPin, Phone } from "lucide-react";
import type { CoverAssignmentPlan } from "../../services/coverRedistributionService";
import { ReassignCoverModal } from "./ReassignCoverModal";""",
    "Add useEffect import to CoverDistributionScreen"
)

patch(CDS,
    """  const [localPlan, setLocalPlan] = useState(plan);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, { exceededBy: number }>>({});
  const [omNotified, setOmNotified] = useState(false);
  const [omAcknowledged, setOmAcknowledged] = useState(false);""",
    """  const [localPlan, setLocalPlan] = useState(plan);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, { exceededBy: number }>>({});
  const [omNotified, setOmNotified] = useState(false);
  const [omAcknowledged, setOmAcknowledged] = useState(false);
  const [washerPhones, setWasherPhones] = useState<Record<string, string>>({});

  // Load washer phone numbers from EMPLOYEE_DATABASE_RECORDS
  useEffect(() => {
    try {
      const raw = localStorage.getItem("EMPLOYEE_DATABASE_RECORDS");
      if (raw) {
        const phones: Record<string, string> = {};
        (JSON.parse(raw) as any[]).forEach((e: any) => {
          phones[e.id] = e.mobile || e.loginMobile || "";
        });
        setWasherPhones(phones);
      }
    } catch (_) {}
  }, []);""",
    "Add washerPhones state loaded from EMPLOYEE_DATABASE_RECORDS"
)

# Add phone call button to cover washer card
patch(CDS,
    """                  {/* Row 1: Washer Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-bold text-gray-900">{washer.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{washer.distanceKm.toFixed(1)} km away</span>
                        </div>
                      </div>
                    </div>""",
    """                  {/* Row 1: Washer Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-bold text-gray-900">{washer.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{washer.distanceKm > 0 ? `${washer.distanceKm.toFixed(1)} km away` : "Same area"}</span>
                          {washerPhones[washer.id] && (
                            <a
                              href={`tel:${washerPhones[washer.id]}`}
                              className="flex items-center gap-1 text-blue-600 underline ml-2"
                              onClick={e => e.stopPropagation()}
                            >
                              <Phone className="h-3 w-3" />
                              Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>""",
    "Add phone call button to cover washer cards"
)

# =============================================================================
# FIX 5 — Pass distanceKm from plan to cover screen
# coverRedistributionService already accepts distanceKm in availableWashers
# but the map in generateCoverPlan uses `0.8 * 5` hardcoded
# =============================================================================
print("\n=== FIX 5: Fix hardcoded distance in coverRedistributionService ===")

SVC = os.path.join(ROOT, "services", "coverRedistributionService.ts")
shutil.copy2(SVC, os.path.join(backup_dir, "coverRedistributionService.ts"))

patch(SVC,
    """    const sortedWashers = availableWashers
      .map((w) => ({
        ...w,
        distanceKm: 0.8 * 5, // Simulated distance
      }))""",
    """    const sortedWashers = availableWashers
      .map((w) => ({
        ...w,
        distanceKm: (w as any).distanceKm ?? 0, // Use real distance if provided
      }))""",
    "Use real distanceKm from availableWashers instead of hardcoded value"
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
  git add src/app/components/supervisor/SupervisorAppConnected.tsx
  git add src/app/components/supervisor/CoverDistributionScreen.tsx
  git add src/app/services/coverRedistributionService.ts
  git commit -m "Fix cover tab: real washers, phone calls, persist notify, adjust allocation modal"
  git push origin main
""")
print("="*65)
