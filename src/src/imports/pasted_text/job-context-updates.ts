Critical: Job Interface, cityId, Revenue Amount, Job Generation

This is Phase 1 of 3. Fix only the 4 critical gaps.

CHANGE 1 — src/app/contexts/JobContext.tsx
1A — Add missing fields to the Job interface. Find:
ts  // Timestamps
  assignedAt?: string;
Add these fields immediately before that line:
ts  // City isolation
  cityId: string;
  city: string;

  // Denormalized display fields (avoid lookups in list views)
  washerName?: string;
  customerName?: string;
  customerPhone?: string;

  // Flattened convenience fields
  area?: string;       // mirrors location.area
  pinCode?: string;    // mirrors location.pinCode
  vehicleType?: string;// mirrors vehicleDetails.category
  vehicleReg?: string; // mirrors vehicleDetails.registration
  units?: number;      // number of wash units in this job

  // Revenue
  amount?: number;     // price charged for this job — used in JOB_COMPLETED event

  // Timestamps
  assignedAt?: string;
1B — Add city filter to all derived views and query methods. Find:
ts  const unassignedJobs = allJobs.filter((j) => j.status === "Unassigned");
  const assignedJobs = allJobs.filter((j) =>
    j.status === "Assigned" || j.status === "Acknowledged" || j.status === "In Progress"
  );
  const completedJobs = allJobs.filter((j) =>
    j.status === "Completed" || j.status === "Verified"
  );
Replace with:
ts  // City filter applied to all derived views — pass cityId when using these
  const unassignedJobs = allJobs.filter((j) => j.status === "Unassigned");
  const assignedJobs   = allJobs.filter((j) =>
    j.status === "Assigned" || j.status === "Acknowledged" || j.status === "In Progress"
  );
  const completedJobs  = allJobs.filter((j) =>
    j.status === "Completed" || j.status === "Verified"
  );

  // City-scoped helpers
  const getJobsByCityId = (cityId: string): Job[] =>
    allJobs.filter(j => j.cityId === cityId);
  const getUnassignedByCity = (cityId: string): Job[] =>
    allJobs.filter(j => j.status === "Unassigned" && j.cityId === cityId);
  const getAssignedByCity = (cityId: string): Job[] =>
    allJobs.filter(j => ["Assigned","Acknowledged","In Progress"].includes(j.status) && j.cityId === cityId);
  const getCompletedByCity = (cityId: string): Job[] =>
    allJobs.filter(j => ["Completed","Verified"].includes(j.status) && j.cityId === cityId);
Add the 4 new methods to the context type interface and the provider value object.
1C — Add amount to JOB_COMPLETED event payload. Find:
ts      emit("JOB_COMPLETED", {
        jobId,
        washerId: job.washerId,
        washerName: job.washerId || "Unknown Washer",
        customerId: job.customerId,
        packageName: job.packageName,
        qualityScore: verificationData?.qualityScore,
        complianceScore: verificationData?.complianceScore,
        completedAt: new Date().toISOString(),
      }, "JobContext");
Replace with:
ts      emit("JOB_COMPLETED", {
        jobId,
        washerId:    job.washerId,
        washerName:  job.washerName || job.washerId || "Unknown Washer",
        customerId:  job.customerId,
        customerName:job.customerName,
        packageName: job.packageName,
        amount:      job.amount || 0,       // ← revenue amount now flows through
        cityId:      job.cityId,
        qualityScore:  verificationData?.qualityScore,
        complianceScore: verificationData?.complianceScore,
        completedAt: new Date().toISOString(),
      }, "JobContext");
1D — Fix generateJobsFromSubscription() to read real subscription + customer data. Find the entire placeholder function body. Replace the for loop contents with:
ts  const generateJobsFromSubscription = (
    subscriptionId: string,
    customerId: string,
    count: number,
    subscriptionData?: {
      packageName?: string;
      vehicleCategory?: string;
      vehicleRegistration?: string;
      vehicleBrand?: string;
      vehicleColor?: string;
      area?: string;
      addressLine1?: string;
      pinCode?: string;
      city?: string;
      cityId?: string;
      amount?: number;
      customerName?: string;
      customerPhone?: string;
      timeSlot?: string;
    }
  ): Job[] => {
    const generatedJobs: Job[] = [];
    for (let i = 0; i < count; i++) {
      const job = createJob({
        customerId,
        subscriptionId,
        scheduledDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        timeSlot: subscriptionData?.timeSlot || "07:00 - 08:00",
        status: "Unassigned",
        jobType: "Regular",
        packageName:   subscriptionData?.packageName || "Standard Package",
        customerName:  subscriptionData?.customerName,
        customerPhone: subscriptionData?.customerPhone,
        amount:        subscriptionData?.amount,
        cityId:        subscriptionData?.cityId || "CITY-SURAT",
        city:          subscriptionData?.city || "Surat",
        area:          subscriptionData?.area,
        pinCode:       subscriptionData?.pinCode,
        vehicleType:   subscriptionData?.vehicleCategory,
        vehicleReg:    subscriptionData?.vehicleRegistration,
        units: 1,
        vehicleDetails: {
          category:     subscriptionData?.vehicleCategory || "Sedan",
          color:        subscriptionData?.vehicleColor    || "Unknown",
          brand:        subscriptionData?.vehicleBrand    || "Unknown",
          registration: subscriptionData?.vehicleRegistration || "Unknown",
        },
        location: {
          addressLine1: subscriptionData?.addressLine1 || "Address from customer profile",
          area:         subscriptionData?.area    || "Unknown",
          city:         subscriptionData?.city    || "Surat",
          pinCode:      subscriptionData?.pinCode || "000000",
        },
        serviceDetails: {},
      });
      generatedJobs.push(job);
    }
    return generatedJobs;
  };
Update the interface signature: generateJobsFromSubscription: (subscriptionId: string, customerId: string, count: number, subscriptionData?: {...}) => Job[];
1E — Fix markJobAsFailed() to auto-create rescheduled job when requested. Find:
ts  const markJobAsFailed = (jobId: string, reason: string, reschedule: boolean) => {
    updateJob(jobId, {
      status: "Failed",
      failureReason: reason,
      rescheduleRequested: reschedule,
    });
  };
Replace with:
ts  const markJobAsFailed = (jobId: string, reason: string, reschedule: boolean) => {
    const failed = allJobs.find(j => j.jobId === jobId);
    updateJob(jobId, { status: "Failed", failureReason: reason, rescheduleRequested: reschedule });

    if (reschedule && failed) {
      // Schedule replacement for next day
      const nextDate = new Date(new Date(failed.scheduledDate).getTime() + 86400000)
        .toISOString().split("T")[0];
      createJob({
        ...failed,
        scheduledDate: nextDate,
        status: "Unassigned",
        washerId: undefined,
        assignedAt: undefined,
        startedAt: undefined,
        completedAt: undefined,
        verificationStatus: undefined,
        failureReason: undefined,
        rescheduleRequested: false,
        qaAuditId: undefined,
      });
    }
  };
Do not change any other file in Phase 1.