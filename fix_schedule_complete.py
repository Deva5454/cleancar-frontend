"""
fix_schedule_complete.py
Reapply all upcoming bookings fixes on top of the p1 backup (550 lines).
Applies in order:
  1. Add activeTab + upcomingJobs state
  2. Add upcoming jobs loading at end of loadRows
  3. Add sub-tab selector UI
  4. Wrap periodic content in activeTab conditional
  5. Add Upcoming Bookings tab with improved card layout

Run: python fix_schedule_complete.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""
import shutil, datetime

FILE = r"E:\3rd June Final Deployment\cleancar-root\src\app\components\supervisor\SupervisorPeriodicScheduleScreen.tsx"

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_complete_{ts}")

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

# ── 1. State ─────────────────────────────────────────────────────────────────
patch(
    '  const [rescheduleError, setRescheduleError] = useState("");',
    '  const [rescheduleError, setRescheduleError] = useState("");\n'
    '  const [activeTab, setActiveTab] = useState<"periodic" | "bookings">("periodic");\n'
    '  const [upcomingJobs, setUpcomingJobs] = useState<any[]>([]);',
    "Add activeTab + upcomingJobs state"
)

# ── 2. Load upcoming bookings at end of loadRows ──────────────────────────────
patch(
    """      const upcoming = periodicScheduleService.getAllCustomersUpcoming(lookAheadDays);
      setRows(upcoming.filter(r => r.occurrences.length > 0));
    } finally {
      setLoading(false);
    }
  }, [lookAheadDays]);""",
    """      const upcoming = periodicScheduleService.getAllCustomersUpcoming(lookAheadDays);
      setRows(upcoming.filter(r => r.occurrences.length > 0));

      // Load upcoming bookings (packs + one-time)
      try {
        const todayStr2 = new Date().toISOString().split("T")[0];
        const horizonDate2 = new Date();
        horizonDate2.setDate(horizonDate2.getDate() + lookAheadDays);
        const horizonStr2 = horizonDate2.toISOString().split("T")[0];

        const custNameMap2: Record<string, string> = {};
        try {
          const rawC2 = localStorage.getItem("cleancar_CITY-SURAT_customers");
          if (rawC2) {
            (JSON.parse(rawC2) as any[]).forEach((c: any) => {
              custNameMap2[c.customerId] = ((c.firstName || "") + " " + (c.lastName || "")).trim() || c.phone || c.customerId;
            });
          }
        } catch (_) {}

        const custPhoneMap2: Record<string, string> = {};
        try {
          const rawCp = localStorage.getItem("cleancar_CITY-SURAT_customers");
          if (rawCp) {
            (JSON.parse(rawCp) as any[]).forEach((c: any) => {
              custPhoneMap2[c.customerId] = c.phone || c.mobile || "";
            });
          }
        } catch (_) {}

        const washerNameMap2: Record<string, string> = {};
        try {
          const rawEDB = localStorage.getItem("EMPLOYEE_DATABASE_RECORDS");
          if (rawEDB) {
            (JSON.parse(rawEDB) as any[])
              .filter((e: any) => e.designation === "Car Washer")
              .forEach((e: any) => {
                washerNameMap2[e.id] = e.fullName || ((e.firstName || "") + " " + (e.lastName || "")).trim();
              });
          }
        } catch (_) {}

        const PACK_KEYWORDS = ["Pack", "pack", "One-Time", "onetime", "Urgent", "urgent"];
        let bookingJobs: any[] = [];

        try {
          const rawJ2 = localStorage.getItem("cleancar_CITY-SURAT_jobs");
          if (rawJ2) {
            bookingJobs = (JSON.parse(rawJ2) as any[]).filter((j: any) => {
              const inWindow = j.scheduledDate >= todayStr2 && j.scheduledDate <= horizonStr2;
              const isPack = PACK_KEYWORDS.some(k =>
                (j.frequency || "").includes(k) ||
                (j.packageName || "").includes(k) ||
                (j.packageType || "").includes(k)
              );
              const isPending = ["Unassigned","Assigned","Acknowledged","In Progress"].includes(j.status);
              return inWindow && isPending;
            });
          }
        } catch (_) {}

        try {
          const rawI2 = localStorage.getItem("cleancar_web_invoices");
          if (rawI2) {
            const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
            (JSON.parse(rawI2) as any[])
              .filter((inv: any) => {
                const name = (inv.items?.[0]?.name || "").toLowerCase();
                return PACK_KEYWORDS.some(k => name.includes(k.toLowerCase())) && inv.createdAt > cutoff;
              })
              .forEach((inv: any) => {
                if (!bookingJobs.some(j => j.jobId === inv.invoiceNumber)) {
                  bookingJobs.push({
                    jobId: inv.invoiceNumber || ("INV-" + Math.random()),
                    customerId: inv.customerId || "",
                    packageName: inv.items?.[0]?.name || "Booking",
                    scheduledDate: inv.createdAt?.split("T")[0] || todayStr2,
                    timeSlot: "TBD",
                    status: "Unassigned",
                    vehicleDetails: { registration: inv.vehicleReg || "" },
                    location: { area: "" },
                  });
                }
              });
          }
        } catch (_) {}

        bookingJobs = bookingJobs.map((j: any) => ({
          ...j,
          customerName: custNameMap2[j.customerId] || j.customerName || j.customerId || "Customer",
          customerPhone: custPhoneMap2[j.customerId] || "",
          washerDisplayName: j.washerId ? (washerNameMap2[j.washerId] || j.washerName || null) : null,
        }));

        bookingJobs.sort((a, b) => (a.scheduledDate || "").localeCompare(b.scheduledDate || ""));
        setUpcomingJobs(bookingJobs);
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  }, [lookAheadDays]);""",
    "Add upcoming bookings loading"
)

# ── 3. Sub-tab selector (add before look-ahead selector) ─────────────────────
patch(
    """      {/* Look-ahead selector */}
      <div className="flex gap-2">""",
    """      {/* Sub-tab selector */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("periodic")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "periodic"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Periodic Services {totalDue > 0 ? `(${totalDue})` : ""}
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "bookings"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Upcoming Bookings {upcomingJobs.length > 0 ? `(${upcomingJobs.length})` : ""}
        </button>
      </div>

      {/* Look-ahead selector */}
      <div className="flex gap-2">""",
    "Add sub-tab selector"
)

# ── 4. Wrap periodic content ──────────────────────────────────────────────────
patch(
    """      {/* Rules callout */}
      <Alert className="border-blue-200 bg-blue-50 py-2">""",
    """      {activeTab === "periodic" && (<>
      {/* Rules callout */}
      <Alert className="border-blue-200 bg-blue-50 py-2">""",
    "Open periodic conditional"
)

patch(
    """        ))
      )}

      {/* Reschedule info notice""",
    """        ))
      )}
      </>)}

      {activeTab === "bookings" && (
        <div className="space-y-3">
          {upcomingJobs.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              No upcoming pack or one-time bookings in the next {lookAheadDays} days.
            </div>
          ) : (
            upcomingJobs.map((job: any) => (
              <Card key={job.jobId} className="border-2 border-indigo-100">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{job.customerName}</p>
                      <p className="text-xs font-medium text-indigo-600">{job.packageName || job.packageType}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      job.status === "Unassigned" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      job.status === "Assigned"   ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-2">
                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {formatDate(job.scheduledDate)}
                        {job.timeSlot && job.timeSlot !== "TBD" ? ` at ${job.timeSlot}` : ""}
                      </p>
                      {job.location?.area && job.location.area.length > 2 && (
                        <p className="text-xs text-gray-500">{job.location.area}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {job.vehicleDetails?.registration && job.vehicleDetails.registration.length > 3 && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {job.vehicleDetails.registration}
                      </span>
                    )}
                    {job.washerDisplayName && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        Washer: {job.washerDisplayName}
                      </span>
                    )}
                    {job.customerPhone && String(job.customerPhone).replace(/[^0-9]/g, "").length >= 10 && (
                      <a href={`tel:${job.customerPhone}`} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded underline">
                        {job.customerPhone}
                      </a>
                    )}
                  </div>
                  {job.status === "Unassigned" && (
                    <p className="text-xs text-amber-600 font-medium mt-2 pt-2 border-t border-gray-100">
                      No washer assigned yet \u2014 go to Dashboard to assign
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reschedule info notice""",
    "Add Upcoming Bookings tab content with improved card layout"
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

with open(FILE, "r", encoding="utf-8") as fh:
    total = fh.read().count("\n")
print(f"  Total lines in file: {total}")
print("""
Next:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/components/supervisor/SupervisorPeriodicScheduleScreen.tsx
  git commit -m "Restore + reapply: Upcoming Bookings tab with clean card layout"
  git push origin main
""")
