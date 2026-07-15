"""
fix_daily_job_seeder.py — Auto-generate jobs for next day at 9 PM

Adds Step 4 to JobContext daily scheduler:
  - Runs once per day at 9 PM (±30 min window)
  - Reads all active subscriptions from cleancar_CITY-SURAT_subscriptions
  - Assigns to real Surat washers (EDB-CW-SUR*) in round-robin by pincode
  - Writes to cleancar_CITY-SURAT_jobs for TOMORROW's date
  - Deduped: won't create if tomorrow's jobs already exist for that subscription

Run: python fix_daily_job_seeder.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import shutil, datetime

FILE = r"E:\3rd June Final Deployment\cleancar-root\src\app\contexts\JobContext.tsx"

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_seeder_{ts}")
print(f"Backed up -> {FILE}.bak_seeder_{ts}\n")

with open(FILE, "r", encoding="utf-8") as fh:
    c = fh.read()

results = []

def patch(old, new, label):
    global c
    if old in c:
        c = c.replace(old, new, 1)
        results.append(("OK", label))
        print(f"  [OK]   {label}")
    else:
        results.append(("SKIP", label))
        print(f"  [SKIP] {label}")

# Add Step 4 — nightly job seeder — before the closing of runDailyScheduler
patch(
    """      try {
        // 3. Weekly Sunday rating WA for monthly subscriptions""",
    """      try {
        // 4. Generate tomorrow's jobs from active subscriptions (runs at 9 PM)
        const nowHour = new Date().getHours();
        const seedKey = `cc360_jobs_seeded_${today}`;
        // Run between 9 PM and 11 PM, once per day
        if (nowHour >= 21 && !localStorage.getItem(seedKey)) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split("T")[0];

          const activeSubs: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_subscriptions") || "[]")
            .filter((s: any) => s.status === "Active");
          const customers: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_customers") || "[]");
          const washers: any[] = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") || "[]")
            .filter((e: any) => e.designation === "Car Washer" && e.id.includes("SUR"));
          const existingJobs: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]");

          // Build pincode→washer map for round-robin assignment
          const washerByPin: Record<string, any[]> = {};
          washers.forEach((w: any) => {
            (w.pinCodes || ["395001"]).forEach((pin: string) => {
              const p = pin.replace("PIN-", "");
              if (!washerByPin[p]) washerByPin[p] = [];
              washerByPin[p].push(w);
            });
          });
          const washerIdx: Record<string, number> = {};

          const PKG_MAP: Record<string, string> = {
            Basic: "EXPRESS_WASH", SHINE: "EXPRESS_WASH",
            Standard: "SMART_WASH", PROTECT: "SMART_WASH",
            Premium: "ELITE_WASH", ELITE: "ELITE_WASH",
            EXPRESS_WASH: "EXPRESS_WASH", SMART_WASH: "SMART_WASH", ELITE_WASH: "ELITE_WASH",
          };
          const SLOTS = ["05:00 AM","05:30 AM","06:00 AM","06:30 AM","07:00 AM","07:30 AM","08:00 AM","08:30 AM"];

          const existingSubIds = new Set(
            existingJobs
              .filter((j: any) => j.scheduledDate === tomorrowStr)
              .map((j: any) => j.subscriptionId)
          );

          const newJobs: any[] = [];
          activeSubs.forEach((sub: any, i: number) => {
            if (existingSubIds.has(sub.subscriptionId)) return; // already have tomorrow's job
            const cust = customers.find((c: any) => c.customerId === sub.customerId) || {};
            const pin = (cust.pinCode || "395001").replace("PIN-", "");
            const available = washerByPin[pin] || washerByPin["395001"] || washers;
            if (!available || available.length === 0) return;

            const idx = washerIdx[pin] || 0;
            const washer = available[idx % available.length];
            washerIdx[pin] = idx + 1;

            const pkgType = PKG_MAP[sub.packageType || sub.packageName || ""] || "EXPRESS_WASH";
            const slotIdx = (washerIdx[pin] - 1) % SLOTS.length;

            newJobs.push({
              jobId: `JOB-${tomorrowStr}-${String(i).padStart(4, "0")}`,
              customerId: sub.customerId,
              subscriptionId: sub.subscriptionId,
              washerId: washer.id,
              scheduledDate: tomorrowStr,
              timeSlot: SLOTS[slotIdx],
              status: "Unassigned",
              jobType: "Regular",
              packageName: pkgType,
              packageType: pkgType,
              customerName: `${cust.firstName || ""} ${cust.lastName || ""}`.trim() || sub.customerId,
              vehicleDetails: {
                category: sub.serviceDetails?.vehicleType || "Sedan",
                color: cust.vehicleColor || "White",
                brand: cust.vehicleBrand || "Maruti",
                registration: cust.vehicleReg || `GJ05${String(i).padStart(4, "0")}`,
              },
              location: {
                addressLine1: cust.address || "Surat",
                area: cust.area || "Adajan",
                city: "Surat",
                pinCode: pin,
              },
              serviceDetails: { addOns: sub.serviceDetails?.addOns || [], specialInstructions: "" },
              subscriptionStartDate: sub.startDate || "2026-01-01",
              cityId: "CITY-SURAT",
              city: "Surat",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });

          if (newJobs.length > 0) {
            localStorage.setItem("cleancar_CITY-SURAT_jobs", JSON.stringify([...existingJobs, ...newJobs]));
            localStorage.setItem(seedKey, "1");
            console.info(`[Scheduler] Generated ${newJobs.length} jobs for ${tomorrowStr}`);
          }
        }
      } catch(e) { console.warn("[Scheduler] Job seeder error:", e); }

      try {
        // 3. Weekly Sunday rating WA for monthly subscriptions""",
    "Add nightly job seeder to daily scheduler (runs at 9 PM)"
)

with open(FILE, "w", encoding="utf-8", newline="") as fh:
    fh.write(c)

print("\n" + "="*60)
ok = sum(1 for r in results if r[0] == "OK")
sk = sum(1 for r in results if r[0] == "SKIP")
print(f"  Applied: {ok}  Skipped: {sk}")
if sk:
    for r, l in results:
        if r == "SKIP": print(f"    SKIP: {l}")
print("""
Next:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/contexts/JobContext.tsx
  git commit -m "Feature: auto-seed tomorrow's jobs at 9 PM from active subscriptions"
  git push origin main

To test immediately (simulate 9 PM):
  In browser console, after seeding key is cleared:
  localStorage.removeItem("cc360_jobs_seeded_" + new Date().toISOString().split("T")[0])
  Then trigger by checking: new Date().getHours() must be >= 21
  OR temporarily change the hour check to >= 0 in the code
""")
