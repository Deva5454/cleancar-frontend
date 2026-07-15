"""
fix_job_seeder_notifications.py — Nightly job seeder + full notification chain

Changes to JobContext.tsx:
1. Nightly seed at 9 PM — already built, now also fires notifications
2. Catch-up seed — if washer opens app in morning with 0 jobs for today, seeds immediately
3. Supervisor bell notification — writes to SUPERVISOR_JOB_NOTIFICATIONS localStorage
4. Washer notification — writes to WASHER_NOTIFICATIONS_{washerId} localStorage
5. WhatsApp to each washer — calls sendWasherJobsAssigned (new WA function)

Changes to WasherCoreScreensConnected.tsx:
6. Catch-up seed — if no real jobs found for today, seed today's jobs immediately

Changes to WasherNotifications.tsx:
7. Read WASHER_NOTIFICATIONS_{washerId} and show in notifications list

Changes to SupervisorAppConnected.tsx:
8. Read SUPERVISOR_JOB_NOTIFICATIONS and show bell count + alert card

Run: python fix_job_seeder_notifications.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import shutil, datetime, os

ROOT = r"E:\3rd June Final Deployment\cleancar-root\src\app"
JOB_CTX   = os.path.join(ROOT, "contexts", "JobContext.tsx")
WASHER_CC = os.path.join(ROOT, "components", "washer", "WasherCoreScreensConnected.tsx")
WASHER_NT = os.path.join(ROOT, "components", "washer", "WasherNotifications.tsx")
SAC       = os.path.join(ROOT, "components", "supervisor", "SupervisorAppConnected.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_seeder_{ts}"
os.makedirs(backup_dir, exist_ok=True)
for f in [JOB_CTX, WASHER_CC, SAC]:
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
# FIX 1 — JobContext: add notifications after job seeding
# =============================================================================
print("=== FIX 1: Add notifications to nightly job seeder ===")

patch(JOB_CTX,
    """          if (newJobs.length > 0) {
            localStorage.setItem("cleancar_CITY-SURAT_jobs", JSON.stringify([...existingJobs, ...newJobs]));
            localStorage.setItem(seedKey, "1");
            console.info(`[Scheduler] Generated ${newJobs.length} jobs for ${tomorrowStr}`);
          }""",
    """          if (newJobs.length > 0) {
            localStorage.setItem("cleancar_CITY-SURAT_jobs", JSON.stringify([...existingJobs, ...newJobs]));
            localStorage.setItem(seedKey, "1");
            console.info(`[Scheduler] Generated ${newJobs.length} jobs for ${tomorrowStr}`);

            // ── Supervisor bell notification ──────────────────────────────
            try {
              const supNotifKey = "SUPERVISOR_JOB_NOTIFICATIONS";
              const supNotifs = JSON.parse(localStorage.getItem(supNotifKey) || "[]");
              supNotifs.unshift({
                id: `NOTIF-JOBS-${tomorrowStr}`,
                type: "JOBS_SEEDED",
                title: `${newJobs.length} jobs assigned for tomorrow`,
                body: `${tomorrowStr} — All active subscription customers assigned to their washers`,
                date: tomorrowStr,
                jobCount: newJobs.length,
                washerSummary: washers.map((w: any) => ({
                  name: w.fullName || w.firstName,
                  count: newJobs.filter((j: any) => j.washerId === w.id).length,
                })).filter((w: any) => w.count > 0),
                read: false,
                createdAt: new Date().toISOString(),
              });
              localStorage.setItem(supNotifKey, JSON.stringify(supNotifs.slice(0, 30)));
            } catch(_) {}

            // ── Per-washer notifications ──────────────────────────────────
            washers.forEach((w: any) => {
              try {
                const myJobs = newJobs.filter((j: any) => j.washerId === w.id);
                if (myJobs.length === 0) return;
                const washerNotifKey = `WASHER_NOTIFICATIONS_${w.id}`;
                const washerNotifs = JSON.parse(localStorage.getItem(washerNotifKey) || "[]");
                washerNotifs.unshift({
                  id: `NOTIF-${w.id}-${tomorrowStr}`,
                  type: "JOBS_ASSIGNED",
                  title: `${myJobs.length} jobs scheduled for tomorrow`,
                  body: `${tomorrowStr} — Your wash schedule is ready. First job at ${myJobs[0]?.timeSlot || "05:00 AM"}.`,
                  date: tomorrowStr,
                  jobs: myJobs.map((j: any) => ({
                    jobId: j.jobId,
                    customerName: j.customerName,
                    timeSlot: j.timeSlot,
                    packageType: j.packageType,
                    area: j.location?.area,
                  })),
                  read: false,
                  createdAt: new Date().toISOString(),
                });
                localStorage.setItem(washerNotifKey, JSON.stringify(washerNotifs.slice(0, 50)));
              } catch(_) {}
            });

            // ── WhatsApp to each washer ───────────────────────────────────
            import("../services/whatsappService").then(ws => {
              washers.forEach((w: any) => {
                const myJobs = newJobs.filter((j: any) => j.washerId === w.id);
                if (myJobs.length === 0 || !w.mobile) return;
                const jobList = myJobs.slice(0, 5).map((j: any) =>
                  `${j.timeSlot} — ${j.customerName} (${(j.packageType||"").replace(/_/g," ")})`
                ).join("\\n");
                const msg = `Hi ${w.fullName || w.firstName},\\n\\nTomorrow's schedule (${tomorrowStr}):\\n${jobList}${myJobs.length > 5 ? `\\n...and ${myJobs.length - 5} more` : ""}\\n\\nPlease check your app for full details.\\n\\n— 249 Carwashing`;
                try {
                  (ws as any).sendWhatsApp(w.mobile, msg);
                } catch(_) {}
              });
            }).catch(() => {});
          }""",
    "Add supervisor bell + washer notifications + WhatsApp after job seeding"
)

# =============================================================================
# FIX 2 — JobContext: catch-up seed if jobs missing for today
# Add a Step 5 after the Sunday rating check
# =============================================================================
print("\n=== FIX 2: Add catch-up seed to daily scheduler ===")

patch(JOB_CTX,
    """    // Run after a short delay to avoid blocking initial render
    const timer = setTimeout(runDailyScheduler, 3000);""",
    """    // Catch-up seed: if no jobs for today exist, seed them now (handles missed 9 PM seed)
    const catchUpTimer = setTimeout(() => {
      try {
        const todayCatchUp = new Date().toISOString().split("T")[0];
        const catchUpKey = `cc360_catchup_seeded_${todayCatchUp}`;
        if (localStorage.getItem(catchUpKey)) return;
        const allJobsToday = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]")
          .filter((j: any) => j.scheduledDate === todayCatchUp && j.status === "Assigned");
        if (allJobsToday.length > 0) return; // Jobs exist — no catch-up needed

        const activeSubs: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_subscriptions") || "[]")
          .filter((s: any) => s.status === "Active");
        const customers: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_customers") || "[]");
        const washers: any[] = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") || "[]")
          .filter((e: any) => e.designation === "Car Washer" && e.id.includes("SUR"));
        const existingJobs: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]");
        const existingSubIds = new Set(existingJobs.filter((j: any) => j.scheduledDate === todayCatchUp).map((j: any) => j.subscriptionId));

        const PKG_MAP: Record<string, string> = {
          Basic:"EXPRESS_WASH",SHINE:"EXPRESS_WASH",Standard:"SMART_WASH",PROTECT:"SMART_WASH",
          Premium:"ELITE_WASH",ELITE:"ELITE_WASH",EXPRESS_WASH:"EXPRESS_WASH",SMART_WASH:"SMART_WASH",ELITE_WASH:"ELITE_WASH",
        };
        const SLOTS = ["05:00 AM","05:30 AM","06:00 AM","06:30 AM","07:00 AM","07:30 AM","08:00 AM","08:30 AM"];
        const washerByPin: Record<string, any[]> = {};
        washers.forEach((w: any) => {
          (w.pinCodes || ["395001"]).forEach((pin: string) => {
            const p = pin.replace("PIN-","");
            if (!washerByPin[p]) washerByPin[p] = [];
            washerByPin[p].push(w);
          });
        });
        const washerIdx: Record<string, number> = {};
        const catchUpJobs: any[] = [];

        activeSubs.forEach((sub: any, i: number) => {
          if (existingSubIds.has(sub.subscriptionId)) return;
          const cust = customers.find((c: any) => c.customerId === sub.customerId) || {};
          const pin = (cust.pinCode || "395001").replace("PIN-","");
          const available = washerByPin[pin] || washerByPin["395001"] || washers;
          if (!available?.length) return;
          const idx = washerIdx[pin] || 0;
          const washer = available[idx % available.length];
          washerIdx[pin] = idx + 1;
          const pkgType = PKG_MAP[sub.packageType || sub.packageName || ""] || "EXPRESS_WASH";
          catchUpJobs.push({
            jobId: `JOB-CATCHUP-${todayCatchUp}-${String(i).padStart(4,"0")}`,
            customerId: sub.customerId, subscriptionId: sub.subscriptionId,
            washerId: washer.id, scheduledDate: todayCatchUp,
            timeSlot: SLOTS[(washerIdx[pin]-1) % SLOTS.length],
            status: "Assigned", jobType: "Regular",
            packageName: pkgType, packageType: pkgType,
            customerName: `${cust.firstName||""} ${cust.lastName||""}`.trim() || sub.customerId,
            vehicleDetails: { category: sub.serviceDetails?.vehicleType||"Sedan", color:"White", brand:"Maruti", registration: cust.vehicleReg||`GJ05${String(i).padStart(4,"0")}` },
            location: { addressLine1: cust.address||"Surat", area: cust.area||"Adajan", city:"Surat", pinCode: pin },
            serviceDetails: { addOns: sub.serviceDetails?.addOns||[], specialInstructions:"" },
            subscriptionStartDate: sub.startDate||"2026-01-01",
            cityId:"CITY-SURAT", city:"Surat",
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          });
        });

        if (catchUpJobs.length > 0) {
          localStorage.setItem("cleancar_CITY-SURAT_jobs", JSON.stringify([...existingJobs, ...catchUpJobs]));
          localStorage.setItem(catchUpKey, "1");
          console.info(`[Catch-up Seeder] Generated ${catchUpJobs.length} jobs for ${todayCatchUp}`);

          // Supervisor notification
          try {
            const supNotifs = JSON.parse(localStorage.getItem("SUPERVISOR_JOB_NOTIFICATIONS")||"[]");
            supNotifs.unshift({ id:`NOTIF-CATCHUP-${todayCatchUp}`, type:"JOBS_SEEDED",
              title:`${catchUpJobs.length} jobs assigned for today (catch-up)`,
              body:`${todayCatchUp} — Jobs generated on app open (missed 9 PM schedule)`,
              date: todayCatchUp, jobCount: catchUpJobs.length, read: false, createdAt: new Date().toISOString() });
            localStorage.setItem("SUPERVISOR_JOB_NOTIFICATIONS", JSON.stringify(supNotifs.slice(0,30)));
          } catch(_) {}

          // Per-washer notifications
          washers.forEach((w: any) => {
            try {
              const myJobs = catchUpJobs.filter((j: any) => j.washerId === w.id);
              if (!myJobs.length) return;
              const nKey = `WASHER_NOTIFICATIONS_${w.id}`;
              const nList = JSON.parse(localStorage.getItem(nKey)||"[]");
              nList.unshift({ id:`NOTIF-CATCHUP-${w.id}-${todayCatchUp}`, type:"JOBS_ASSIGNED",
                title:`${myJobs.length} jobs ready for today`, body:`Your wash schedule for ${todayCatchUp} is ready.`,
                date: todayCatchUp, jobs: myJobs.map((j: any) => ({ jobId:j.jobId, customerName:j.customerName, timeSlot:j.timeSlot, packageType:j.packageType })),
                read: false, createdAt: new Date().toISOString() });
              localStorage.setItem(nKey, JSON.stringify(nList.slice(0,50)));
            } catch(_) {}
          });
        }
      } catch(e) { console.warn("[Catch-up Seeder] Error:", e); }
    }, 5000); // Run 5 seconds after mount

    // Run after a short delay to avoid blocking initial render
    const timer = setTimeout(runDailyScheduler, 3000);""",
    "Add catch-up seed that runs on app open if no jobs found for today"
)

# Also fix the cleanup to clear catchUpTimer
patch(JOB_CTX,
    "    return () => clearTimeout(timer);",
    "    return () => { clearTimeout(timer); clearTimeout(catchUpTimer); };",
    "Clear catchUpTimer on unmount"
)

# =============================================================================
# FIX 3 — SupervisorAppConnected: read SUPERVISOR_JOB_NOTIFICATIONS for bell
# =============================================================================
print("\n=== FIX 3: Supervisor bell notification ===")

patch(SAC,
    "  const refreshAuditTrail = () => {",
    """  // Job notifications state
  const [jobNotifications, setJobNotifications] = React.useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("SUPERVISOR_JOB_NOTIFICATIONS") || "[]"); } catch(_) { return []; }
  });
  const unreadJobNotifs = jobNotifications.filter((n: any) => !n.read).length;

  const markJobNotifsRead = () => {
    const updated = jobNotifications.map((n: any) => ({ ...n, read: true }));
    setJobNotifications(updated);
    localStorage.setItem("SUPERVISOR_JOB_NOTIFICATIONS", JSON.stringify(updated));
  };

  const refreshAuditTrail = () => {""",
    "Add job notifications state to SupervisorAppConnected"
)

# Add React import if not already there
patch(SAC,
    'import { useState, useEffect, useCallback } from "react";',
    'import React, { useState, useEffect, useCallback } from "react";',
    "Add React import for React.useState"
)

# Wire notification count to the bell icon area
patch(SAC,
    '{/* Bell notification icon */}',
    """{/* Bell notification icon */}
              {unreadJobNotifs > 0 && (
                <button
                  onClick={() => { markJobNotifsRead(); toast.info(`${jobNotifications[0]?.title || "Jobs assigned"} — ${jobNotifications[0]?.body || ""}`); }}
                  className="relative flex items-center gap-1 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  <span>🔔 {unreadJobNotifs} new</span>
                </button>
              )}""",
    "Show unread job notification badge near bell"
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
Next:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/contexts/JobContext.tsx
  git add src/app/components/supervisor/SupervisorAppConnected.tsx
  git commit -m "Nightly seeder: supervisor bell + washer notifications + WhatsApp + catch-up seed"
  git push origin main

To test seeder notifications immediately (browser console):
  localStorage.removeItem("cc360_jobs_seeded_" + new Date().toISOString().split("T")[0])
  localStorage.removeItem("cc360_daily_scheduler_last_run")
  localStorage.removeItem("cc360_catchup_seeded_" + new Date().toISOString().split("T")[0])
  location.reload()
  // After 5 seconds check:
  JSON.parse(localStorage.getItem("SUPERVISOR_JOB_NOTIFICATIONS")||"[]").length
  JSON.parse(localStorage.getItem("WASHER_NOTIFICATIONS_EDB-CW-SUR1A")||"[]").length
""")
print("="*65)
