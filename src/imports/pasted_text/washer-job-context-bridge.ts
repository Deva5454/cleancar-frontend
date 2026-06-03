WasherContext → JobContext Bridge + Supervisor Live Counts + Inventory Linkage

This is Phase 2 of 3. All Phase 1 changes must be applied first.

CHANGE 1 — src/app/contexts/WasherContext.tsx
1A — Bridge completeJob to JobContext and emit JOB_COMPLETED. Find:
ts  const completeJob = () => {
    if (!shouldActivate || !activeJob) return;

    washerDataService.completeJob(activeJob.id);
    loadData(); // Refresh all data
  };
Replace with:
ts  const completeJob = () => {
    if (!shouldActivate || !activeJob) return;

    washerDataService.completeJob(activeJob.id);

    // ✅ Bridge: update the canonical JobContext record
    const jobContextJob = jobContext.getJobById(activeJob.id);
    if (jobContextJob) {
      jobContext.completeJob(activeJob.id, {
        qualityScore:   activeJob.qualityScore   || 85,
        complianceScore:activeJob.complianceScore || 90,
      });
      // emit is handled inside jobContext.completeJob with the amount field
    } else {
      // Job only exists in washer service — emit event directly
      emit("JOB_COMPLETED", {
        jobId:       activeJob.id,
        washerId:    washerId,
        washerName:  profile?.name || washerId,
        customerId:  activeJob.customerId,
        packageName: activeJob.packageName,
        amount:      activeJob.amount || 0,
        cityId:      activeJob.cityId,
        completedAt: new Date().toISOString(),
      }, "WasherContext");
    }

    // ✅ Trigger incentive calculation after job completion
    if (washerId) {
      incentiveEngineService.processJobCompletion?.({
        washerId,
        jobId:      activeJob.id,
        cityId:     activeJob.cityId,
        packageName:activeJob.packageName,
        completedAt:new Date().toISOString(),
      });
    }

    loadData();
  };
Add useJobs import at the top and call const jobContext = useJobs() inside the provider. Also add const washerId = profile?.employeeId if not already present.
1B — Replace washerDataService.getTodayJobs() with real JobContext data. Find where jobs state is populated from washerDataService in the loadData function. Find:
ts    return mockWasherDataService.getTodayJobs(washerId, 12);
    // or similar call
Replace the jobs loading logic with:
ts    const realJobs = jobContext.getJobsByWasherId(washerId).filter(j =>
      j.scheduledDate === new Date().toISOString().split("T")[0] ||
      j.status === "In Progress" || j.status === "Assigned" || j.status === "Acknowledged"
    );
    // Map JobContext.Job to WasherContext's CustomerJob format
    // Keep washerDataService fallback if no real jobs assigned yet
    return realJobs.length > 0 ? realJobs.map(j => ({
      id:           j.jobId,
      customerId:   j.customerId,
      customerName: j.customerName || j.customerId,
      packageType:  j.packageName,
      vehicleCategory: j.vehicleType || j.vehicleDetails?.category || "4W",
      vehicleReg:   j.vehicleReg || j.vehicleDetails?.registration || "",
      address:      j.location?.addressLine1 || "",
      pinCode:      j.pinCode || j.location?.pinCode || "",
      status:       j.status === "Assigned" ? "ASSIGNED"
                  : j.status === "Acknowledged" ? "ACKNOWLEDGED"
                  : j.status === "In Progress" ? "IN_PROGRESS"
                  : j.status === "Completed" ? "COMPLETED" : "PENDING",
      amount:       j.amount || 0,
      cityId:       j.cityId,
      scheduledDate:j.scheduledDate,
      timeSlot:     j.timeSlot,
    })) : mockWasherDataService.getTodayJobs(washerId, 12);

CHANGE 2 — src/app/contexts/SupervisorContext.tsx — Fix hardcoded job counts
Add useJobs import:
tsimport { useJobs } from "./JobContext";
Inside SupervisorProvider, add:
ts  const { getAssignedByCity, getCompletedByCity, getUnassignedByCity } = useJobs();
Find the summary object where todayJobs: 0 and pendingJobs: 0 are hardcoded. Replace:
ts            todayJobs:     0, // Can be calculated from JobContext
            completedJobs: 0, // Can be calculated from JobContext
with:
ts            todayJobs:     getAssignedByCity(supervisorCityId).filter(j =>
                             j.scheduledDate === new Date().toISOString().split("T")[0]).length,
            completedJobs: getCompletedByCity(supervisorCityId).filter(j =>
                             j.completedAt?.startsWith(new Date().toISOString().split("T")[0])).length,
Find pendingJobs: 0 in the summary:
ts            pendingJobs: 0, // Can be calculated from JobContext
Replace with:
ts            pendingJobs: getUnassignedByCity(supervisorCityId).filter(j =>
              j.scheduledDate === new Date().toISOString().split("T")[0]).length,
supervisorCityId is the city of the supervisor — derive it from currentUser.cityId or the existing employee lookup already in the context.

CHANGE 3 — src/app/components/operations/WasherJobReport.tsx — Use real inventory
Add imports at the top:
tsimport { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
Inside the component, replace the hardcoded availableProducts array:
ts  const { inventory } = useInventory();
  const { city } = useCity();

  // Get consumable products from inventory for this city
  const availableProducts = inventory
    .filter(item => item.cityId === city && item.category === "Chemical" && item.centralStock > 0)
    .map(item => ({
      id:   item.itemId,
      name: item.name,
      cost: item.costPerUnit,
      requiresReasonIfNotUsed: item.reorderLevel > 0,
    }));

  // Fallback to default products if inventory is empty
  const products = availableProducts.length > 0 ? availableProducts : [
    { id: "PROD-001", name: "Car Shampoo",    cost: 8.5,  requiresReasonIfNotUsed: true },
    { id: "PROD-002", name: "Wheel Cleaner",  cost: 5.2,  requiresReasonIfNotUsed: false },
    { id: "PROD-003", name: "Dashboard Polish",cost: 3.8, requiresReasonIfNotUsed: false },
  ];
Replace all subsequent references to availableProducts with products.
Also after the job report is submitted (in handleSubmit), decrement inventory for used products:
ts  import { useInventory } from "../../contexts/InventoryContext";
  const { issueToWasher } = useInventory();

  // In handleSubmit, after calculating costs:
  products.forEach(p => {
    const usage = productUsage.get(p.id);
    if (usage?.used) {
      issueToWasher?.({
        itemId: p.id, washerId, quantity: 1,
        jobId, cityId: city,
        issuedAt: new Date().toISOString(),
      });
    }
  });
Do not change any other file in Phase 2.