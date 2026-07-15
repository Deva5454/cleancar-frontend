"""
fix_add_upcoming_bookings_v2.py — Add Upcoming Bookings sub-tab (emoji-safe version)
"""

import os, shutil, datetime

ROOT   = r"E:\3rd June Final Deployment\cleancar-root\src\app"
SCREEN = os.path.join(ROOT, "components", "supervisor", "SupervisorPeriodicScheduleScreen.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_upcoming2_{ts}"
os.makedirs(backup_dir, exist_ok=True)
shutil.copy2(SCREEN, os.path.join(backup_dir, "SupervisorPeriodicScheduleScreen.tsx"))
print(f"Backed up -> {backup_dir}\n")

with open(SCREEN, "r", encoding="utf-8") as fh:
    content = fh.read()

results = []

def patch(old, new, label):
    global content
    if old in content:
        content = content.replace(old, new, 1)
        results.append(("OK", label))
        print(f"  [OK]   {label}")
    else:
        results.append(("SKIP", label))
        print(f"  [SKIP] {label}")

# FIX 1 — Add state
patch(
    '  const [rescheduleError, setRescheduleError] = useState("");',
    '  const [rescheduleError, setRescheduleError] = useState("");\n  const [activeTab, setActiveTab] = useState<"periodic" | "bookings">("periodic");\n  const [upcomingJobs, setUpcomingJobs] = useState<any[]>([]);',
    "Add activeTab and upcomingJobs state"
)

# FIX 2 — Load upcoming jobs at end of loadRows
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
              custNameMap2[c.customerId] = (c.firstName || "") + " " + (c.lastName || "");
              custNameMap2[c.customerId] = custNameMap2[c.customerId].trim() || c.phone || c.customerId;
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

        // Also include web invoices for pack/one-time
        try {
          const rawI2 = localStorage.getItem("cleancar_web_invoices");
          if (rawI2) {
            const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
            (JSON.parse(rawI2) as any[])
              .filter((inv: any) => {
                const name = (inv.items?.[0]?.name || "").toLowerCase();
                const isPack = PACK_KEYWORDS.some(k => name.includes(k.toLowerCase()));
                return isPack && inv.createdAt > cutoff;
              })
              .forEach((inv: any) => {
                if (!bookingJobs.some(j => j.jobId === inv.invoiceNumber)) {
                  bookingJobs.push({
                    jobId: inv.invoiceNumber || ("INV-" + Math.random()),
                    customerId: inv.customerId || "",
                    customerName: custNameMap2[inv.customerId || ""] || inv.customerName || "Customer",
                    packageName: inv.items?.[0]?.name || "Booking",
                    scheduledDate: inv.createdAt?.split("T")[0] || todayStr2,
                    timeSlot: "TBD",
                    status: "Unassigned",
                    vehicleDetails: { registration: inv.vehicleReg || "" },
                    location: { area: inv.address || "" },
                  });
                }
              });
          }
        } catch (_) {}

        bookingJobs = bookingJobs.map((j: any) => ({
          ...j,
          customerName: custNameMap2[j.customerId] || j.customerName || j.customerId || "Customer",
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

# FIX 3 — Add sub-tab selector and rename header
patch(
    """      {/* Look-ahead selector */}
      <div className="flex gap-2">
        {[3, 7, 14].map(d => (
          <button
            key={d}
            onClick={() => setLookAheadDays(d)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              lookAheadDays === d
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>""",
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
      <div className="flex gap-2">
        {[3, 7, 14].map(d => (
          <button
            key={d}
            onClick={() => setLookAheadDays(d)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              lookAheadDays === d
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>""",
    "Add sub-tab selector"
)

# FIX 4 — Wrap periodic content
patch(
    """      {/* Rules callout */}
      <Alert className="border-amber-200 bg-amber-50 py-2">""",
    """      {activeTab === "periodic" && (<>
      {/* Rules callout */}
      <Alert className="border-amber-200 bg-amber-50 py-2">""",
    "Open periodic conditional"
)

# FIX 5 — Close periodic and add bookings
patch(
    """        ))
      )}

      {/* Reschedule dialog */}""",
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
                      <p className="text-xs text-gray-500">{job.packageName || job.packageType}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      job.status === "Unassigned" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      job.status === "Assigned"   ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(job.scheduledDate)}
                      {job.timeSlot && job.timeSlot !== "TBD" ? " at " + job.timeSlot : ""}
                    </span>
                    {job.vehicleDetails?.registration && (
                      <span>Vehicle: {job.vehicleDetails.registration}</span>
                    )}
                    {job.location?.area && (
                      <span>Area: {job.location.area}</span>
                    )}
                  </div>
                  {job.status === "Unassigned" && (
                    <p className="text-xs text-amber-600 font-medium mt-2 pt-2 border-t border-gray-100">
                      Washer not yet assigned — go to Dashboard to assign
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reschedule dialog */}""",
    "Add Upcoming Bookings tab content"
)

# Write file
with open(SCREEN, "w", encoding="utf-8", newline="") as fh:
    fh.write(content)

print("\n" + "="*60)
ok = sum(1 for r in results if r[0] == "OK")
sk = sum(1 for r in results if r[0] == "SKIP")
print(f"  Applied: {ok}  Skipped: {sk}")
if sk:
    print("  SKIPPED:")
    for r, l in results:
        if r == "SKIP": print(f"    - {l}")
print("""
Next steps:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/components/supervisor/SupervisorPeriodicScheduleScreen.tsx
  git commit -m "Add Upcoming Bookings sub-tab to Schedule screen"
  git push origin main
""")
