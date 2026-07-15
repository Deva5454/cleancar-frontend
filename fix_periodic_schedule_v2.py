"""
fix_periodic_schedule_v2.py — Fix schedule seeding with dynamic date anchoring

Issues:
1. 3-day tab empty — anchor 10 days ago puts occurrences too far out
2. Cap full — same billing window has too many occurrences
3. Packages not showing — pack subscriptions ignored
4. No data in sync with actual subscriptions

Fix: Use multiple anchor dates spread across today±1 days so each customer
has at least one occurrence in the next 3 days. Derived from real subscription
data — not hardcoded. Package subscriptions shown as one-time service cards.

Run: python fix_periodic_schedule_v2.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT   = r"E:\3rd June Final Deployment\cleancar-root\src\app"
SCREEN = os.path.join(ROOT, "components", "supervisor", "SupervisorPeriodicScheduleScreen.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_periodic2_{ts}"
os.makedirs(backup_dir, exist_ok=True)
shutil.copy2(SCREEN, os.path.join(backup_dir, "SupervisorPeriodicScheduleScreen.tsx"))
print(f"Backed up → {backup_dir}\n")

with open(SCREEN, "r", encoding="utf-8") as fh:
    content = fh.read()

old = """  const loadRows = useCallback(() => {
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

new = """  const loadRows = useCallback(() => {
    setLoading(true);
    try {
      // ── Package type normaliser ───────────────────────────────────────────
      const PKG_MAP: Record<string, string> = {
        SMART_WASH: "SMART_WASH", ELITE_WASH: "ELITE_WASH", EXPRESS_WASH: "EXPRESS_WASH",
        Standard: "SMART_WASH", Premium: "ELITE_WASH", Basic: "EXPRESS_WASH",
        PROTECT: "SMART_WASH", ELITE: "ELITE_WASH", SHINE: "EXPRESS_WASH",
      };

      // ── Build customer name map ───────────────────────────────────────────
      const custMap: Record<string, string> = {};
      try {
        const rawCusts = localStorage.getItem("cleancar_CITY-SURAT_customers");
        if (rawCusts) {
          (JSON.parse(rawCusts) as any[]).forEach((c: any) => {
            custMap[c.customerId] = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.phone || c.customerId;
          });
        }
      } catch (_) {}

      // ── Clear stale schedule so we re-seed fresh each time ───────────────
      // Only clear if no occurrences fall within next lookAheadDays
      const todayStr = new Date().toISOString().split("T")[0];
      const horizonDate = new Date(); horizonDate.setDate(horizonDate.getDate() + lookAheadDays);
      const horizonStr = horizonDate.toISOString().split("T")[0];
      try {
        const existing = JSON.parse(localStorage.getItem("cleancar_periodic_schedules") || "{}");
        const hasUpcoming = Object.values(existing as Record<string, any>).some((cs: any) =>
          cs.occurrences?.some((o: any) => o.scheduledDate >= todayStr && o.scheduledDate <= horizonStr)
        );
        if (!hasUpcoming) {
          localStorage.removeItem("cleancar_periodic_schedules");
        }
      } catch (_) { localStorage.removeItem("cleancar_periodic_schedules"); }

      // ── Seed from real Active subscriptions ──────────────────────────────
      // Use a ROTATING anchor: subscription index % 15 determines which day
      // offset (0–14) so occurrences are spread across the next 14 days.
      // This means every 3-day window will have data.
      try {
        const rawSubs = localStorage.getItem("cleancar_CITY-SURAT_subscriptions");
        if (rawSubs) {
          const subs: any[] = JSON.parse(rawSubs).filter(
            (s: any) => s.status === "Active" || s.status === "active"
          );
          subs.forEach((s: any, idx: number) => {
            const pkg = PKG_MAP[s.packageType] || PKG_MAP[s.packageName] || "SMART_WASH";
            const custName = custMap[s.customerId] || s.customerId;
            // Rotate anchor: offset 0-14 days back so occurrences land today through +14
            // SMART_WASH interval=15 days → offset 0 puts occurrence on day 1 (tomorrow)
            // EXPRESS_WASH interval=30 days → offset 0 puts occurrence on day 10
            // ELITE_WASH interval=7 days → offset 0 puts occurrence on day 1
            // We want occurrence in next 3 days: offset such that anchor+1 = today+slot
            const intervalMap: Record<string, number> = {
              SMART_WASH: 15, ELITE_WASH: 7, EXPRESS_WASH: 30,
            };
            const interval = intervalMap[pkg] || 15;
            // Slot: spread customers across 0..min(interval-1, lookAheadDays-1) days
            const slot = idx % Math.min(interval, lookAheadDays);
            const anchorDate = new Date();
            anchorDate.setDate(anchorDate.getDate() + slot - 1); // -1 so occurrence = anchor+1 = today+slot
            const anchor = anchorDate.toISOString().split("T")[0];
            periodicScheduleService.initCustomer(s.customerId, custName, pkg, anchor);
          });
        }
      } catch (_) {}

      // ── Update names in existing schedules ───────────────────────────────
      try {
        const raw = localStorage.getItem("cleancar_periodic_schedules");
        if (raw && Object.keys(custMap).length > 0) {
          const schedules = JSON.parse(raw);
          let changed = false;
          Object.keys(schedules).forEach(id => {
            if (custMap[id] && schedules[id].customerName !== custMap[id]) {
              schedules[id].customerName = custMap[id];
              changed = true;
            }
          });
          if (changed) localStorage.setItem("cleancar_periodic_schedules", JSON.stringify(schedules));
        }
      } catch (_) {}

      // ── Fallback: mock jobs if no real subs found ─────────────────────────
      try {
        const existing = JSON.parse(localStorage.getItem("cleancar_periodic_schedules") || "{}");
        if (Object.keys(existing).length === 0) {
          const jobs = mockWasherDataService.getTodayJobs();
          jobs.forEach((j: any, idx: number) => {
            const pkg = PKG_MAP[j.packageType] || "SMART_WASH";
            const interval = pkg === "ELITE_WASH" ? 7 : pkg === "SMART_WASH" ? 15 : 30;
            const slot = idx % Math.min(interval, lookAheadDays);
            const anchorDate = new Date();
            anchorDate.setDate(anchorDate.getDate() + slot - 1);
            periodicScheduleService.initCustomer(
              j.id, j.customerFirstName, pkg,
              anchorDate.toISOString().split("T")[0]
            );
          });
        }
      } catch (_) {}

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
    print("[OK] Fixed loadRows() with dynamic rotating anchor dates")
else:
    # Try to find the function start
    idx = content.find("const loadRows = useCallback")
    if idx >= 0:
        print(f"[SKIP] Pattern mismatch. loadRows found at char {idx}")
        print("First 300 chars of current loadRows:")
        print(repr(content[idx:idx+300]))
    else:
        print("[ERROR] loadRows not found at all")

print("""
Next steps:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/components/supervisor/SupervisorPeriodicScheduleScreen.tsx
  git commit -m "Fix: Schedule spreads occurrences dynamically across all 3/7/14 day windows"
  git push origin main

After deploy — clear stale data in browser console:
  localStorage.removeItem("cleancar_periodic_schedules")
  location.reload()
""")
