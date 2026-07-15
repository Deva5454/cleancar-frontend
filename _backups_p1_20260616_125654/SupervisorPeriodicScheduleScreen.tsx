/**
 * SupervisorPeriodicScheduleScreen.tsx
 *
 * Supervisor view for managing periodic service schedules.
 *
 * What the supervisor can do:
 *   - See all customers with periodic services due in the next 7 days
 *   - See each customer's monthly cap and how many are used/remaining
 *   - Reschedule a specific occurrence to a different date in the same billing month
 *   - Cannot reschedule an already-completed occurrence
 *   - Cannot reschedule to a date that would exceed the monthly cap
 *
 * Rules enforced by periodicScheduleService:
 *   - New date must be in the same billing month
 *   - Monthly cap cannot be exceeded (customer does not get an extra service)
 *   - Already-completed services cannot be moved
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import {
  CalendarDays, ChevronRight, RefreshCw, AlertCircle,
  CheckCircle2, Clock, User, Repeat2, Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  periodicScheduleService,
  PERIODIC_SERVICE_META,
  type PeriodicOccurrence,
  type MonthlyUsage,
} from "../../services/periodicScheduleService";
import { mockWasherDataService } from "../../services/mockWasherDataService";
import { useRole } from "../../contexts/RoleContext";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CustomerRow {
  customerId: string;
  customerName: string;
  packageType: string;
  occurrences: PeriodicOccurrence[];
  monthlyUsage: MonthlyUsage;
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PKG_COLORS: Record<string, string> = {
  SHINE:    "bg-blue-50 text-blue-700 border-blue-200",
  PROTECT:  "bg-purple-50 text-purple-700 border-purple-200",
  ELITE:    "bg-green-50 text-green-700 border-green-200",
  ELITE_2W: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled:    "bg-teal-50 text-teal-700 border-teal-200",
  completed:    "bg-green-50 text-green-700 border-green-200",
  rescheduled:  "bg-purple-50 text-purple-700 border-purple-200",
  skipped:      "bg-gray-50 text-gray-500 border-gray-200",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", weekday: "short",
  });
}

function usageBar(used: number, cap: number): string {
  if (cap === 0) return "";
  return `${used}/${cap}`;
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function SupervisorPeriodicScheduleScreen() {
  const { currentUser } = useRole();
  const supervisorId = currentUser?.employeeId ?? "SUP-UNKNOWN";

  const [rows, setRows]           = useState<CustomerRow[]>([]);
  const [lookAheadDays, setLookAheadDays] = useState(7);
  const [loading, setLoading]     = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    customerId: string;
    customerName: string;
    occ: PeriodicOccurrence;
    usage: MonthlyUsage;
  } | null>(null);
  const [newDate, setNewDate]     = useState("");
  const [reason, setReason]       = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [activeTab, setActiveTab] = useState<"periodic" | "bookings">("periodic");
  const [upcomingJobs, setUpcomingJobs] = useState<any[]>([]);

  // â”€â”€ Seed + load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadRows = useCallback(() => {
    setLoading(true);
    try {
      // â”€â”€ Package type normaliser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const PKG_MAP: Record<string, string> = {
        SMART_WASH: "SMART_WASH", ELITE_WASH: "ELITE_WASH", EXPRESS_WASH: "EXPRESS_WASH",
        Standard: "SMART_WASH", Premium: "ELITE_WASH", Basic: "EXPRESS_WASH",
        PROTECT: "SMART_WASH", ELITE: "ELITE_WASH", SHINE: "EXPRESS_WASH",
      };

      // â”€â”€ Build customer name map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const custMap: Record<string, string> = {};
      try {
        const rawCusts = localStorage.getItem("cleancar_CITY-SURAT_customers");
        if (rawCusts) {
          (JSON.parse(rawCusts) as any[]).forEach((c: any) => {
            custMap[c.customerId] = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.phone || c.customerId;
          });
        }
      } catch (_) {}

      // â”€â”€ Clear stale schedule so we re-seed fresh each time â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ Seed from real Active subscriptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Use a ROTATING anchor: subscription index % 15 determines which day
      // offset (0â€“14) so occurrences are spread across the next 14 days.
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
            // SMART_WASH interval=15 days â†’ offset 0 puts occurrence on day 1 (tomorrow)
            // EXPRESS_WASH interval=30 days â†’ offset 0 puts occurrence on day 10
            // ELITE_WASH interval=7 days â†’ offset 0 puts occurrence on day 1
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

      // â”€â”€ Update names in existing schedules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ Fallback: mock jobs if no real subs found â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  }, [lookAheadDays]);

  useEffect(() => { loadRows(); }, [loadRows]);

  // â”€â”€ Reschedule flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function openReschedule(row: CustomerRow, occ: PeriodicOccurrence) {
    // View-only: supervisor cannot reschedule — show info modal only
    setRescheduleTarget({
      customerId:   row.customerId,
      customerName: row.customerName,
      occ,
      usage: row.monthlyUsage,
    });
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const totalDue = rows.reduce((s, r) => s + r.occurrences.length, 0);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            Periodic Service Schedule
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Next {lookAheadDays} days Â· {totalDue} service{totalDue !== 1 ? "s" : ""} due Â·
            Tap any service to view details
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRows} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Sub-tab selector */}
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
      </div>

      {activeTab === "periodic" && (<>
      {/* Rules callout */}
      <Alert className="border-amber-200 bg-amber-50 py-2">
        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
        <AlertDescription className="text-xs text-amber-800">
          <strong>Cap rule:</strong> You can move a service to a different day in the same month â€”
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
        rows.map(row => (
          <Card key={row.customerId} className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800">{row.customerName}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PKG_COLORS[row.packageType] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {row.packageType}
                  </span>
                </div>
                {/* Monthly usage badges */}
                <div className="flex gap-1">
                  {(Object.entries(row.monthlyUsage) as [string, { used: number; cap: number }][])
                    .filter(([, v]) => v.cap > 0)
                    .map(([svc, v]) => (
                      <span key={svc} className={`text-xs px-1.5 py-0.5 rounded border ${
                        v.used >= v.cap ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-gray-500 border-gray-200"
                      }`}>
                        {PERIODIC_SERVICE_META[svc as keyof typeof PERIODIC_SERVICE_META]?.icon}
                        {" "}{usageBar(v.used, v.cap)}
                        {v.used >= v.cap && " ðŸ”’"}
                      </span>
                    ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-gray-100">
              {row.occurrences.map(occ => {
                const meta      = PERIODIC_SERVICE_META[occ.serviceType];
                const isLocked  = occ.status === "completed";
                const capEntry  = row.monthlyUsage[occ.serviceType as keyof MonthlyUsage];
                const capFull   = capEntry && capEntry.used >= capEntry.cap && occ.status !== "completed";

                return (
                  <div key={occ.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{meta.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-800">{meta.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[occ.status] ?? ""}`}>
                            {occ.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(occ.scheduledDate)}
                          </span>
                          {occ.status === "rescheduled" && (
                            <span className="text-xs text-purple-600">
                              (was {formatDate(occ.originalDate)})
                            </span>
                          )}
                          {occ.rescheduleReason && (
                            <span className="text-xs text-gray-400 italic">
                              Â· {occ.rescheduleReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLocked ? (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done
                        </div>
                      ) : capFull ? (
                        <div className="flex items-center gap-1 text-xs text-red-500">
                          <Lock className="w-3.5 h-3.5" />
                          Cap full
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic">Scheduled</div>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
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
                      Washer not yet assigned â€” go to Dashboard to assign
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reschedule info notice â€” supervisor is view only */}
      {rescheduleTarget && (
        <div style={{position:"fixed",inset:0,zIndex:10001,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <div style={{background:"white",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"400px"}}>
            <p style={{fontWeight:700,fontSize:"16px",marginBottom:"8px"}}>Reschedule Info</p>
            <p style={{fontSize:"13px",color:"#475569",marginBottom:"4px"}}>
              {PERIODIC_SERVICE_META[rescheduleTarget.occ.serviceType]?.icon}{" "}
              <strong>{PERIODIC_SERVICE_META[rescheduleTarget.occ.serviceType]?.name}</strong>{" "}
              for <strong>{rescheduleTarget.customerName}</strong>
            </p>
            <p style={{fontSize:"12px",color:"#64748b",marginBottom:"16px"}}>
              Scheduled: {formatDate(rescheduleTarget.occ.scheduledDate)}{" "}
              {rescheduleTarget.occ.status === "rescheduled" && rescheduleTarget.occ.rescheduledBy && (
                <span style={{color:"#7c3aed"}}> â€” Rescheduled by {rescheduleTarget.occ.rescheduledBy}</span>
              )}
            </p>
            <div style={{background:"#f1f5f9",borderRadius:"8px",padding:"12px",marginBottom:"16px"}}>
              <p style={{fontSize:"12px",color:"#475569",fontWeight:600}}>Supervisor cannot reschedule periodic services.</p>
              <p style={{fontSize:"12px",color:"#64748b",marginTop:"4px"}}>Reschedules are initiated by the customer (via app notification) or by TSE on customer request.</p>
            </div>
            <button
              onClick={() => setRescheduleTarget(null)}
              style={{width:"100%",padding:"10px",border:"none",borderRadius:"8px",background:"#6366f1",color:"white",fontWeight:600,cursor:"pointer"}}
            >Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
