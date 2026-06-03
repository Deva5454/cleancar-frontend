OperationsDataCapture Fix + OperationsRouter Multi-City + washerName Display + Incentive Trigger

This is Phase 3 of 3. All Phase 1 and Phase 2 changes must be applied first.

CHANGE 1 — src/app/components/operations/OperationsDataCapture.tsx — Fix field mapping
The component accesses j.cityId, j.washerName, j.area, j.vehicleType, j.units directly on the Job object. With Phase 1 changes these fields now exist on the Job interface. The only remaining fix is ensuring the todayJobs filter works correctly. Find:
ts  const todayJobs = allJobs.filter(j => j.scheduledDate === todayStr && j.cityId === cityId);
This is now correct since cityId exists on Job. No change needed to the filter.
Fix the units mapping. Find:
ts    unitCount: j.units||1,
This is now correct. Verify the washerName and area mappings:
ts    washerName: j.washerName||j.washerId||"",
    location: j.area||"",
    vehicleType: j.vehicleType||"4W",
These are now populated from Phase 1's new interface fields. No further change needed.
Add a "No jobs found" empty state for when todayJobs.length === 0:
tsx  if (todayJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg font-medium">No jobs scheduled for today</p>
        <p className="text-sm mt-1">Jobs will appear here when assigned for {todayStr}</p>
      </div>
    );
  }

CHANGE 2 — src/app/contexts/JobContext.tsx — Fix washerName in event payload
In assignJobToWasher, after setting washerId, look up the employee name. Add a washerName update:
ts  const assignJobToWasher = (jobId: string, washerId: string, washerName?: string) => {
    updateJob(jobId, {
      washerId,
      washerName: washerName || washerId, // ← stores display name, not ID
      status: "Assigned",
      assignedAt: new Date().toISOString(),
    });
    const job = allJobs.find(j => j.jobId === jobId);
    if (job) {
      emit("JOB_ASSIGNED", {
        jobId, washerId,
        washerName: washerName || washerId,
        customerName: job.customerName || job.customerId,
        scheduledDate: job.scheduledDate,
      }, "JobContext");
    }
  };
Update the interface: assignJobToWasher: (jobId: string, washerId: string, washerName?: string) => void;
All callers of assignJobToWasher should pass the washer's display name as the third argument.

CHANGE 3 — src/app/components/operations/OperationsRouter.tsx — Super Admin multi-city view
Find:
ts    case "Super Admin":
    case "Admin":
      // Admins default to City Manager view for overview
      return <CityManagerApp />;
Replace with:
ts    case "Super Admin":
    case "Admin":
      return <MultiCityOperationsView />;
Create a minimal MultiCityOperationsView inline in the same file:
tsximport { useJobs } from "../../contexts/JobContext";
import { useCity } from "../../contexts/CityContext";

function MultiCityOperationsView() {
  const { allJobs } = useJobs();
  const { availableCities } = useCity();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Operations — All Cities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableCities.map(city => {
          const cityJobs  = allJobs.filter(j => j.cityId === city.id);
          const unassigned = cityJobs.filter(j => j.status === "Unassigned").length;
          const inProgress = cityJobs.filter(j => j.status === "In Progress").length;
          const completed  = cityJobs.filter(j => j.status === "Completed" || j.status === "Verified").length;
          return (
            <div key={city.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">{city.displayName}</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-amber-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-amber-700">{unassigned}</div>
                  <div className="text-xs text-amber-600">Unassigned</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-700">{inProgress}</div>
                  <div className="text-xs text-blue-600">In Progress</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-700">{completed}</div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

After all 3 phases the following gaps are fully resolved:

Job has cityId, city, washerName, customerName, area, vehicleType, units, amount fields (Gap 1, 5)
City-scoped job query methods added to JobContext (Gap 1, 13)
WasherContext.completeJob() updates JobContext and emits JOB_COMPLETED (Gap 2)
JOB_COMPLETED carries amount — revenue records automatically (Gap 3)
generateJobsFromSubscription accepts real subscription data and populates all fields (Gap 4)
SupervisorContext.pendingJobs and todayJobs derived from live JobContext (Gap 6)
WasherJobReport reads products from InventoryContext and decrements stock on use (Gap 7)
WasherContext reads jobs from JobContext not mock service (Gap 8)
washerName in events and storage is display name not employeeId (Gap 9)
Super Admin sees multi-city operations overview (Gap 10)
Incentive engine called after job completion in WasherContext (Gap 11)
markJobAsFailed with reschedule: true auto-creates next-day replacement job (Gap 12)