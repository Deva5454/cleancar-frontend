"""
fix_periodic_schedule.py — Seed periodic schedule data from real subscriptions

Problem: SupervisorPeriodicScheduleScreen calls mockWasherDataService.getTodayJobs()
which returns jobs with old subscriptionStartDate values — occurrences fall outside
the 14-day lookahead window so nothing shows.

Fix: Override the loadRows() seed logic in SupervisorPeriodicScheduleScreen to also
read from cleancar_CITY-SURAT_subscriptions and seed customers with today-anchored
start dates so occurrences appear in the next 14 days.

Run: python fix_periodic_schedule.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT   = r"E:\3rd June Final Deployment\cleancar-root\src\app"
SCREEN = os.path.join(ROOT, "components", "supervisor", "SupervisorPeriodicScheduleScreen.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_periodic_{ts}"
os.makedirs(backup_dir, exist_ok=True)
shutil.copy2(SCREEN, os.path.join(backup_dir, "SupervisorPeriodicScheduleScreen.tsx"))
print(f"Backed up → {backup_dir}\n")

with open(SCREEN, "r", encoding="utf-8") as fh:
    content = fh.read()

# Replace the loadRows function to seed from real subscriptions
old = """  const loadRows = useCallback(() => {
    setLoading(true);
    try {
      // Seed all today's jobs into periodicScheduleService if not already done
      const jobs = mockWasherDataService.getTodayJobs();
      periodicScheduleService.seedFromJobs(
        jobs.map(j => ({
          id: j.id,
          customerFirstName: j.customerFirstName,
          packageType: j.packageType,
          subscriptionStartDate: j.subscriptionStartDate,
        }))
      );

      const upcoming = periodicScheduleService.getAllCustomersUpcoming(lookAheadDays);
      setRows(upcoming.filter(r => r.occurrences.length > 0));
    } finally {
      setLoading(false);
    }
  }, [lookAheadDays]);"""

new = """  const loadRows = useCallback(() => {
    setLoading(true);
    try {
      // ── Source 1: real subscriptions from localStorage ──────────────────
      const today = new Date().toISOString().split("T")[0];
      // Anchor start date 10 days ago so occurrences fall in the next 14 days
      const anchorDate = new Date();
      anchorDate.setDate(anchorDate.getDate() - 10);
      const anchor = anchorDate.toISOString().split("T")[0];

      // Map seedAllData packageType names → periodicScheduleService keys
      const PKG_MAP: Record<string, string> = {
        SMART_WASH:   "SMART_WASH",
        ELITE_WASH:   "ELITE_WASH",
        EXPRESS_WASH: "EXPRESS_WASH",
        Standard:     "SMART_WASH",
        Premium:      "ELITE_WASH",
        Basic:        "EXPRESS_WASH",
        SHINE:        "EXPRESS_WASH",
        PROTECT:      "SMART_WASH",
        ELITE:        "ELITE_WASH",
      };

      // Read real subscriptions
      try {
        const rawSubs = localStorage.getItem("cleancar_CITY-SURAT_subscriptions");
        if (rawSubs) {
          const subs: any[] = JSON.parse(rawSubs);
          subs
            .filter((s: any) => s.status === "Active" || s.status === "active")
            .forEach((s: any) => {
              const pkg = PKG_MAP[s.packageType] || PKG_MAP[s.frequency] || "SMART_WASH";
              const custName = s.packageName || s.customerId || "Customer";
              // Use anchor date so occurrences fall within next 14 days
              periodicScheduleService.initCustomer(
                s.customerId,
                custName,
                pkg,
                anchor
              );
            });
        }
      } catch (_) {}

      // Read real customers for better names
      try {
        const rawCusts = localStorage.getItem("cleancar_CITY-SURAT_customers");
        if (rawCusts) {
          const custs: any[] = JSON.parse(rawCusts);
          const custMap: Record<string, string> = {};
          custs.forEach((c: any) => {
            custMap[c.customerId] = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.phone;
          });
          // Re-init with real names (initCustomer won't overwrite existing — clear first)
          const rawSchedules = localStorage.getItem("cleancar_periodic_schedules");
          if (rawSchedules) {
            const schedules = JSON.parse(rawSchedules);
            Object.keys(schedules).forEach(customerId => {
              if (custMap[customerId]) {
                schedules[customerId].customerName = custMap[customerId];
              }
            });
            localStorage.setItem("cleancar_periodic_schedules", JSON.stringify(schedules));
          }
        }
      } catch (_) {}

      // ── Source 2: mockWasherDataService fallback ─────────────────────────
      const jobs = mockWasherDataService.getTodayJobs();
      periodicScheduleService.seedFromJobs(
        jobs.map((j: any) => ({
          id: j.id,
          customerFirstName: j.customerFirstName,
          packageType: PKG_MAP[j.packageType] || j.packageType,
          // Use anchor date for mock jobs too so they appear in next 14 days
          subscriptionStartDate: anchor,
        }))
      );

      const upcoming = periodicScheduleService.getAllCustomersUpcoming(lookAheadDays);
      setRows(upcoming.filter(r => r.occurrences.length > 0));
    } finally {
      setLoading(false);
    }
  }, [lookAheadDays]);"""

if old in content:
    content = content.replace(old, new, 1)
    with open(SCREEN, "w", encoding="utf-8", newline="") as fh:
        fh.write(content)
    print("[OK] Fixed loadRows() — seeds from real subscriptions with current anchor date")
else:
    print("[SKIP] Pattern not found — printing first 20 chars of loadRows area for debug")
    idx = content.find("const loadRows")
    if idx >= 0:
        print(repr(content[idx:idx+200]))

print("""
Next steps:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/components/supervisor/SupervisorPeriodicScheduleScreen.tsx
  git commit -m "Fix: Schedule tab seeds from real subscriptions with current date anchor"
  git push origin main

After deploy — if schedule still empty, run in browser console:
  localStorage.removeItem("cleancar_periodic_schedules")
  location.reload()
This forces re-seeding with the new anchor date logic.
""")
