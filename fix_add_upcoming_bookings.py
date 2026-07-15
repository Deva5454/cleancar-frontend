"""
fix_add_upcoming_bookings.py — Add Upcoming Bookings sub-tab to Schedule screen

Adds two sub-tabs:
  1. Periodic Services (existing content)
  2. Upcoming Bookings (new — shows Pack of 2, Pack of 4, One-Time, future dated jobs)

Reads from cleancar_CITY-SURAT_jobs filtered by scheduledDate >= today
and status in [Unassigned, Assigned, Acknowledged]

Run: python fix_add_upcoming_bookings.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import os, shutil, datetime

ROOT   = r"E:\3rd June Final Deployment\cleancar-root\src\app"
SCREEN = os.path.join(ROOT, "components", "supervisor", "SupervisorPeriodicScheduleScreen.tsx")

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = rf"E:\3rd June Final Deployment\cleancar-root\_backups_upcoming_{ts}"
os.makedirs(backup_dir, exist_ok=True)
shutil.copy2(SCREEN, os.path.join(backup_dir, "SupervisorPeriodicScheduleScreen.tsx"))
print(f"Backed up \u2192 {backup_dir}\n")

with open(SCREEN, "r", encoding="utf-8") as fh:
    content = fh.read()

# ── Step 1: Add useState for activeTab after existing useState declarations ──
old_state = '  const [rescheduleError, setRescheduleError] = useState("");'
new_state = '''  const [rescheduleError, setRescheduleError] = useState("");
  const [activeTab, setActiveTab] = useState<"periodic" | "bookings">("periodic");
  const [upcomingJobs, setUpcomingJobs] = useState<any[]>([]);'''

if old_state in content:
    content = content.replace(old_state, new_state, 1)
    print("[OK] Added activeTab and upcomingJobs state")
else:
    print("[SKIP] Could not add state — pattern not found")

# ── Step 2: Load upcoming jobs in loadRows ───────────────────────────────────
old_load_end = """      const upcoming = periodicScheduleService.getAllCustomersUpcoming(lookAheadDays);
      setRows(upcoming.filter(r => r.occurrences.length > 0));
    } finally {
      setLoading(false);
    }
  }, [lookAheadDays]);"""

new_load_end = """      const upcoming = periodicScheduleService.getAllCustomersUpcoming(lookAheadDays);
      setRows(upcoming.filter(r => r.occurrences.length > 0));

      // ── Load upcoming bookings (packs + one-time + future dated) ─────────
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const horizonDate = new Date();
        horizonDate.setDate(horizonDate.getDate() + lookAheadDays);
        const horizonStr = horizonDate.toISOString().split("T")[0];

        // Build customer name map
        const custNameMap: Record<string, string> = {};
        try {
          const rawC = localStorage.getItem("cleancar_CITY-SURAT_customers");
          if (rawC) {
            (JSON.parse(rawC) as any[]).forEach((c: any) => {
              custNameMap[c.customerId] = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.phone || c.customerId;
            });
          }
        } catch (_) {}

        // Read jobs
        const PACK_TYPES = ["Pack of 2", "Pack of 4", "One-Time", "Urgent Wash", "pack2", "pack4", "onetime", "urgent", "One-Time Wash"];
        let jobs: any[] = [];

        // Source 1: real jobs from localStorage
        try {
          const rawJ = localStorage.getItem("cleancar_CITY-SURAT_jobs");
          if (rawJ) {
            const allJobs: any[] = JSON.parse(rawJ);
            jobs = allJobs.filter((j: any) => {
              const isUpcoming = j.scheduledDate >= todayStr && j.scheduledDate <= horizonStr;
              const isPack = PACK_TYPES.some(t =>
                (j.frequency || "").includes(t) ||
                (j.packageName || "").includes(t) ||
                (j.jobType || "").includes(t) ||
                (j.packageType || "").includes(t)
              );
              const isPending = ["Unassigned", "Assigned", "Acknowledged", "In Progress"].includes(j.status);
              return isUpcoming && isPending;
            });
          }
        } catch (_) {}

        // Source 2: web invoices (buy page orders)
        try {
          const rawI = localStorage.getItem("cleancar_web_invoices");
          if (rawI) {
            const invoices: any[] = JSON.parse(rawI);
            invoices
              .filter((inv: any) => {
                const isPack = PACK_TYPES.some(t =>
                  (inv.items?.[0]?.name || "").toLowerCase().includes(t.toLowerCase())
                );
                const isRecent = inv.createdAt && inv.createdAt >= new Date(Date.now() - 30 * 86400000).toISOString();
                return isPack && isRecent;
              })
              .forEach((inv: any) => {
                // Add as upcoming booking if not already in jobs
                const alreadyIn = jobs.some(j => j.invoiceNumber === inv.invoiceNumber);
                if (!alreadyIn) {
                  jobs.push({
                    jobId: inv.invoiceNumber,
                    customerId: inv.customerId,
                    customerName: custNameMap[inv.customerId] || inv.customerName || "Customer",
                    packageName: inv.items?.[0]?.name || "Booking",
                    packageType: inv.items?.[0]?.name || "Booking",
                    scheduledDate: inv.createdAt?.split("T")[0] || todayStr,
                    timeSlot: "TBD",
                    status: "Unassigned",
                    vehicleDetails: { registration: inv.vehicleReg || "" },
                    location: { area: inv.address || "" },
                    isFromInvoice: true,
                  });
                }
              });
          }
        } catch (_) {}

        // Enrich with customer names
        jobs = jobs.map((j: any) => ({
          ...j,
          customerName: custNameMap[j.customerId] || j.customerName || j.customerId || "Customer",
        }));

        // Sort by date then time
        jobs.sort((a, b) => {
          const dateCompare = (a.scheduledDate || "").localeCompare(b.scheduledDate || "");
          if (dateCompare !== 0) return dateCompare;
          return (a.timeSlot || "").localeCompare(b.timeSlot || "");
        });

        setUpcomingJobs(jobs);
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  }, [lookAheadDays]);"""

if old_load_end in content:
    content = content.replace(old_load_end, new_load_end, 1)
    print("[OK] Added upcoming bookings loading logic")
else:
    print("[SKIP] Could not add load logic — pattern not found")

# ── Step 3: Replace the render return with tabbed layout ────────────────────
old_render_start = """  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            Periodic Service Schedule
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Next {lookAheadDays} days \xb7 {totalDue} service{totalDue !== 1 ? "s" : ""} due \xb7
            Tap any service to reschedule within the month
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRows} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
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
      </div>"""

new_render_start = """  const statusColor: Record<string, string> = {
    Unassigned: "bg-amber-50 text-amber-700 border-amber-200",
    Assigned:   "bg-blue-50 text-blue-700 border-blue-200",
    Acknowledged:"bg-indigo-50 text-indigo-700 border-indigo-200",
    "In Progress":"bg-green-50 text-green-700 border-green-200",
  };

  const pkgIcon = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("urgent")) return "\u26a1";
    if (n.includes("pack of 4")) return "\ud83d\udcc5";
    if (n.includes("pack of 2")) return "\ud83d\udcd3";
    if (n.includes("one-time") || n.includes("onetime")) return "1\ufe0f\u20e3";
    return "\ud83d\udce6";
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            Schedule
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Next {lookAheadDays} days \xb7 Tap to reschedule or view details
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRows} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("periodic")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "periodic"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          \ud83d\uddd3\ufe0f Periodic Services {totalDue > 0 && `(\u2022${totalDue})`}
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "bookings"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          \ud83d\udce6 Upcoming Bookings {upcomingJobs.length > 0 && `(\u2022${upcomingJobs.length})`}
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
      </div>"""

if old_render_start in content:
    content = content.replace(old_render_start, new_render_start, 1)
    print("[OK] Added sub-tab header UI")
else:
    print("[SKIP] Could not add sub-tab header — pattern not found")

# ── Step 4: Wrap existing periodic content in conditional + add bookings tab ─
old_periodic_section = """      {/* Rules callout */}
      <Alert className="border-amber-200 bg-amber-50 py-2">
        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
        <AlertDescription className="text-xs text-amber-800">
          <strong>Cap rule:</strong> You can move a service to a different day in the same month \u2014
          but the customer cannot receive an additional service beyond their plan's monthly allowance.
          Completed services cannot be rescheduled.
        </AlertDescription>
      </Alert>

      {/* Customer rows */}
      {rows.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          No periodic services due in the next {lookAheadDays} days.
        </div>
      ) : (
        rows.map(row => ("""

new_periodic_section = """      {activeTab === "periodic" && (
        <>
          {/* Rules callout */}
          <Alert className="border-amber-200 bg-amber-50 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800">
              <strong>Cap rule:</strong> You can move a service to a different day in the same month \u2014
              but the customer cannot receive an additional service beyond their plan\u2019s monthly allowance.
              Completed services cannot be rescheduled.
            </AlertDescription>
          </Alert>

          {/* Customer rows */}
          {rows.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              No periodic services due in the next {lookAheadDays} days.
            </div>
          ) : (
            rows.map(row => ("""

if old_periodic_section in content:
    content = content.replace(old_periodic_section, new_periodic_section, 1)
    print("[OK] Wrapped periodic content in activeTab conditional")
else:
    print("[SKIP] Could not wrap periodic section — pattern not found")

# ── Step 5: Close the periodic conditional and add bookings section ──────────
old_periodic_end = """        ))
      )}

      {/* Reschedule dialog */}"""

new_periodic_end = """            ))
          )}
        </>
      )}

      {activeTab === "bookings" && (
        <div className="space-y-3">
          {upcomingJobs.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              No upcoming pack or one-time bookings in the next {lookAheadDays} days.
            </div>
          ) : (
            upcomingJobs.map((job: any) => (
              <Card key={job.jobId} className="overflow-hidden border-2 border-indigo-100">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{pkgIcon(job.packageName || job.packageType)}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {job.customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {job.packageName || job.packageType}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[job.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(job.scheduledDate)} {job.timeSlot && job.timeSlot !== "TBD" ? `\xb7 ${job.timeSlot}` : ""}
                    </span>
                    {job.vehicleDetails?.registration && (
                      <span>\ud83d\ude97 {job.vehicleDetails.registration}</span>
                    )}
                    {job.location?.area && (
                      <span>\ud83d\udccd {job.location.area}</span>
                    )}
                  </div>
                  {job.status === "Unassigned" && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-amber-600 font-medium">
                        \u26a0\ufe0f Washer not yet assigned \u2014 go to Dashboard to assign
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reschedule dialog */}"""

if old_periodic_end in content:
    content = content.replace(old_periodic_end, new_periodic_end, 1)
    print("[OK] Added Upcoming Bookings tab content")
else:
    print("[SKIP] Could not add bookings content — pattern not found")

with open(SCREEN, "w", encoding="utf-8", newline="") as fh:
    fh.write(content)

print("""
Done. Next steps:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/components/supervisor/SupervisorPeriodicScheduleScreen.tsx
  git commit -m "Add Upcoming Bookings sub-tab to Schedule screen (packs + one-time)"
  git push origin main
""")
