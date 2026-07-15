"""
fix_washer_seed.py — Seed comprehensive demo data for washer module testing

Strategy:
- Keep mock service for demo (Arjun/Priya/Vikram — 3 jobs covering all plan types)
- Add 2 extra jobs: one Cover job + one with Add-ons to test all checklist paths
- Seed today's jobs into localStorage so real washer login works too
- Auto-seed on every app load (daily dedup via localStorage key)

Jobs seeded (5 total):
  JOB-001: Arjun — EXPRESS_WASH — Hatchback — Adajan (daily water wash only today)
  JOB-002: Priya — SMART_WASH — Sedan — Vesu (shampoo + interior today = video required)
  JOB-003: Vikram — ELITE_WASH — SUV — Citylight (shampoo + dashboard + wax today)
  JOB-004: Meera — SMART_WASH — Cover job (isCover=true)
  JOB-005: Ravi — EXPRESS_WASH + Interior add-on (tests add-on checklist path)

Run: python fix_washer_seed.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import shutil, datetime

FILE = r"E:\3rd June Final Deployment\cleancar-root\src\app\components\washer\WasherCoreScreensConnected.tsx"

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_seed_{ts}")
print(f"Backed up -> {FILE}.bak_seed_{ts}\n")

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

# =============================================================================
# FIX 1 — Replace the seed block with comprehensive demo seeder
# =============================================================================

patch(
    """  // ── LOAD JOBS ON MOUNT — real jobs from localStorage, fallback to mock ─────────
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const washerId = currentUser?.employeeId || "";
    let loaded: CustomerJob[] = [];

    if (washerId) {
      try {
        const raw = localStorage.getItem("cleancar_CITY-SURAT_jobs");
        if (raw) {
          const allJobs: any[] = JSON.parse(raw);
          const myJobs = allJobs.filter(j =>
            j.washerId === washerId &&
            j.scheduledDate === today &&
            ["Assigned","Acknowledged","In Progress"].includes(j.status)
          );
          loaded = myJobs.map(j => ({
            id: j.jobId,
            timeSlot: j.timeSlot || "06:00 AM",
            customerFirstName: j.customerName || j.customerId || "Customer",
            area: j.location?.area || "Surat",
            pinCode: j.location?.pinCode || "395001",
            city: j.city || "Surat",
            addressLine1: j.location?.addressLine1 || "",
            vehicleCategory: j.vehicleDetails?.category || "Sedan",
            vehicleColor: j.vehicleDetails?.color || "White",
            vehicleBrand: j.vehicleDetails?.brand || "Maruti",
            vehicleRegistration: j.vehicleDetails?.registration || "",
            packageName: j.packageType || j.packageName || "EXPRESS_WASH",
            packageType: j.packageType || j.packageName || "EXPRESS_WASH",
            serviceFrequency: "Daily",
            subscriptionMonth: today.slice(0,7),
            subscriptionStartDate: j.subscriptionStartDate || "2026-01-01",
            jobType: (j.jobType as any) || "Regular",
            status: (j.status as any) || "Assigned",
            specialInstructions: j.serviceDetails?.specialInstructions || "",
            customerId: j.customerId,
          }));
        }
      } catch (_) {}
    }

    // Fallback to mock if no real jobs
    if (loaded.length === 0) {
      mockWasherDataService.clearCache();
      loaded = mockWasherDataService.getTodayJobs(washerId || "WASHER-DEMO");
    }

    setJobs(loaded);
  }, [currentUser?.employeeId]);""",
    """  // ── LOAD JOBS ON MOUNT — real jobs + comprehensive demo seed ─────────────────
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const washerId = currentUser?.employeeId || "WASHER-DEMO";

    // Seed comprehensive demo jobs into localStorage once per day
    const seedKey = `cc360_washer_demo_seeded_${washerId}_${today}`;
    if (!localStorage.getItem(seedKey)) {
      try {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const fmt = (hour: number, min: number) => {
          const hh = hour % 24;
          return `${String(hh).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
        };
        // 5 slots starting from now, 45 min apart
        const slots = [0,1,2,3,4].map(i => {
          const totalMin = h*60+m+i*45;
          const sh = Math.floor(totalMin/60); const sm = totalMin%60;
          const eh = Math.floor((totalMin+30)/60); const em = (totalMin+30)%60;
          return `${fmt(sh,sm)} - ${fmt(eh,em)}`;
        });

        // Subscription start dates for periodic flag triggering
        // Use specific dates to ensure periodic services show today
        const subStartShampoo = new Date(Date.now() - 15*86400000).toISOString().split("T")[0]; // 15 days ago → fortnightly shampoo triggers
        const subStartInterior = new Date(Date.now() - 15*86400000).toISOString().split("T")[0];
        const subStartElite = new Date(Date.now() - 7*86400000).toISOString().split("T")[0]; // 7 days ago → weekly shampoo triggers

        const demoJobs = [
          {
            jobId: `DEMO-${washerId}-001`,
            customerId: "CUST-SUR-001",
            washerId,
            scheduledDate: today,
            timeSlot: slots[0],
            status: "Assigned",
            jobType: "Regular",
            packageName: "EXPRESS_WASH",
            packageType: "EXPRESS_WASH",
            customerName: "Arjun Patel",
            vehicleDetails: { category: "Hatchback", color: "White", brand: "Maruti", registration: "GJ-05-AK-1234" },
            location: { addressLine1: "B-204, Sunrise Residency, Adajan", area: "Adajan", city: "Surat", pinCode: "395001" },
            serviceDetails: { addOns: [], specialInstructions: "Park car in original spot after wash" },
            subscriptionStartDate: new Date(Date.now()-10*86400000).toISOString().split("T")[0],
            parkingInstructions: "Society parking - left side near gate",
            cityId: "CITY-SURAT", city: "Surat",
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          },
          {
            jobId: `DEMO-${washerId}-002`,
            customerId: "CUST-SUR-002",
            washerId,
            scheduledDate: today,
            timeSlot: slots[1],
            status: "Assigned",
            jobType: "Regular",
            packageName: "SMART_WASH",
            packageType: "SMART_WASH",
            customerName: "Priya Shah",
            vehicleDetails: { category: "Mid-Size Sedan", color: "Silver", brand: "Honda", registration: "GJ-05-BK-5678" },
            location: { addressLine1: "A-301, Royal Heights, Vesu", area: "Vesu", city: "Surat", pinCode: "395007" },
            serviceDetails: { addOns: [], specialInstructions: "Avoid using high pressure on windows" },
            subscriptionStartDate: subStartShampoo,
            parkingInstructions: "Covered parking slot 15",
            cityId: "CITY-SURAT", city: "Surat",
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          },
          {
            jobId: `DEMO-${washerId}-003`,
            customerId: "CUST-SUR-003",
            washerId,
            scheduledDate: today,
            timeSlot: slots[2],
            status: "Assigned",
            jobType: "Regular",
            packageName: "ELITE_WASH",
            packageType: "ELITE_WASH",
            customerName: "Vikram Trivedi",
            vehicleDetails: { category: "Mid/Large SUV", color: "Black", brand: "Toyota", registration: "GJ-05-CM-9012" },
            location: { addressLine1: "C-101, Prime Apartments, Citylight", area: "Citylight", city: "Surat", pinCode: "395007" },
            serviceDetails: { addOns: [], specialInstructions: "Extra attention to wheel cleaning required" },
            subscriptionStartDate: subStartElite,
            parkingInstructions: "Basement parking B2, Slot 42",
            cityId: "CITY-SURAT", city: "Surat",
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          },
          {
            jobId: `DEMO-${washerId}-004`,
            customerId: "CUST-SUR-004",
            washerId,
            scheduledDate: today,
            timeSlot: slots[3],
            status: "Assigned",
            jobType: "Regular",
            packageName: "SMART_WASH",
            packageType: "SMART_WASH",
            customerName: "Meera Joshi",
            isCoverJob: true,
            vehicleDetails: { category: "Hatchback", color: "Red", brand: "Tata", registration: "GJ-05-DM-3456" },
            location: { addressLine1: "D-402, Green Park Society, Piplod", area: "Piplod", city: "Surat", pinCode: "395009" },
            serviceDetails: { addOns: [], specialInstructions: "Cover job — original washer on leave" },
            subscriptionStartDate: subStartInterior,
            parkingInstructions: "Main gate parking available",
            cityId: "CITY-SURAT", city: "Surat",
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          },
          {
            jobId: `DEMO-${washerId}-005`,
            customerId: "CUST-SUR-005",
            washerId,
            scheduledDate: today,
            timeSlot: slots[4],
            status: "Assigned",
            jobType: "Regular",
            packageName: "EXPRESS_WASH",
            packageType: "EXPRESS_WASH",
            customerName: "Ravi Desai",
            vehicleDetails: { category: "Compact Sedan", color: "Blue", brand: "Maruti", registration: "GJ-05-ER-7890" },
            location: { addressLine1: "E-105, Shanti Nagar, Althan", area: "Althan", city: "Surat", pinCode: "395010" },
            serviceDetails: { addOns: ["Interior Cleaning"], specialInstructions: "Customer sensitive to strong chemical smells" },
            subscriptionStartDate: new Date(Date.now()-20*86400000).toISOString().split("T")[0],
            parkingInstructions: "Visitor parking near lobby",
            cityId: "CITY-SURAT", city: "Surat",
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          },
        ];

        const existingJobs = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]");
        // Remove old demo jobs for this washer+today before re-seeding
        const filtered = existingJobs.filter((j: any) =>
          !(j.washerId === washerId && j.scheduledDate === today && j.jobId?.startsWith("DEMO-"))
        );
        localStorage.setItem("cleancar_CITY-SURAT_jobs", JSON.stringify([...filtered, ...demoJobs]));
        localStorage.setItem(seedKey, "1");
      } catch (_) {}
    }

    // Now load jobs — try real jobs from localStorage first
    let loaded: CustomerJob[] = [];
    try {
      const raw = localStorage.getItem("cleancar_CITY-SURAT_jobs");
      if (raw) {
        const allJobs: any[] = JSON.parse(raw);
        const myJobs = allJobs.filter((j: any) =>
          j.washerId === washerId &&
          j.scheduledDate === today &&
          ["Assigned","Acknowledged","In Progress"].includes(j.status)
        );
        if (myJobs.length > 0) {
          loaded = myJobs.map((j: any) => ({
            id: j.jobId,
            timeSlot: j.timeSlot || "06:00 AM",
            customerFirstName: j.customerName || j.customerId || "Customer",
            area: j.location?.area || "Surat",
            pinCode: j.location?.pinCode || "395001",
            city: j.city || "Surat",
            addressLine1: j.location?.addressLine1 || "",
            vehicleCategory: j.vehicleDetails?.category || "Sedan",
            vehicleColor: j.vehicleDetails?.color || "White",
            vehicleBrand: j.vehicleDetails?.brand || "Maruti",
            vehicleRegistration: j.vehicleDetails?.registration || "",
            packageName: j.packageType || j.packageName || "EXPRESS_WASH",
            packageType: j.packageType || j.packageName || "EXPRESS_WASH",
            serviceFrequency: "Daily",
            subscriptionMonth: today.slice(0,7),
            subscriptionStartDate: j.subscriptionStartDate || "2026-01-01",
            jobType: (j.jobType as any) || "Regular",
            status: (j.status as any) || "Assigned",
            specialInstructions: j.serviceDetails?.specialInstructions || "",
            parkingInstructions: j.parkingInstructions || "",
            isCoverJob: j.isCoverJob || false,
            serviceDetails: j.serviceDetails || { addOns: [] },
            customerId: j.customerId,
            ...(() => {
              try {
                const { computePeriodicFlagsB } = mockWasherDataService as any;
                if (typeof computePeriodicFlagsB === "function") {
                  return computePeriodicFlagsB(j.jobId, j.packageType, j.subscriptionStartDate);
                }
              } catch (_) {}
              return {};
            })(),
          }));
        }
      }
    } catch (_) {}

    // Final fallback — mock data (should never reach here after seeding)
    if (loaded.length === 0) {
      mockWasherDataService.clearCache();
      loaded = mockWasherDataService.getTodayJobs(washerId);
    }

    setJobs(loaded);
  }, [currentUser?.employeeId]);""",
    "Replace seed block with comprehensive demo seeder"
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
  git add src/app/components/washer/WasherCoreScreensConnected.tsx
  git commit -m "Washer: seed 5 demo jobs covering all plan types, cover job, add-on"
  git push origin main
""")
