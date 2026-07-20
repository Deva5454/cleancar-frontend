/**
 * portalTestDataSeed — real, one-time test data for verifying every
 * customer portal feature end to end.
 *
 * Follows the same real migration pattern already established in this
 * app (see MigrationInitializer.tsx / payrollMigrationService.ts): a
 * versioned key checked once, marked "DONE" after running, never
 * re-runs. This does NOT touch fresh/empty localStorage seed data (that
 * mechanism only fires on an empty database, which wouldn't affect a
 * live site that already has real customers) — this runs regardless of
 * what's already there, and only ever adds new, clearly-labeled test
 * jobs, never modifies or deletes anything real.
 *
 * Targets Priya Shah (9800100001) — a real, already-existing customer
 * with an active subscription — looked up dynamically by phone number,
 * not a hardcoded ID, so this works correctly regardless of her actual
 * customerId on the live database.
 */

const SEED_VERSION = "V1";
const SEED_KEY = `PORTAL_TEST_DATA_SEED_${SEED_VERSION}`;

export function hasSeededPortalTestData(): boolean {
  return localStorage.getItem(SEED_KEY) === "DONE";
}

export function markPortalTestDataSeeded(): void {
  localStorage.setItem(SEED_KEY, "DONE");
}

const TEST_PHONE = "9800100001"; // Priya Shah — real, existing customer

export interface SeedContext {
  customers: any[];
  createJob: (job: any) => any;
  updateJob: (jobId: string, updates: any) => void;
}

export function seedPortalTestData(ctx: SeedContext): { seeded: boolean; count: number } {
  if (hasSeededPortalTestData()) return { seeded: false, count: 0 };

  const customer = ctx.customers.find((c: any) => c.phone?.replace(/\D/g, "").endsWith(TEST_PHONE));
  if (!customer) return { seeded: false, count: 0 };

  const today = new Date();
  const addDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  };
  const pastDate = (n: number) => addDays(-n);

  const baseJob = {
    customerId: customer.customerId,
    vehicleDetails: { category: "Hatchback / Compact Sedan", brand: "Hyundai", color: "Silver", registration: "GJ05BE1001" },
    location: { addressLine1: customer.address?.line1 || "", area: customer.address?.area || "", city: customer.address?.city || "Surat", pinCode: customer.address?.pinCode || "" },
    serviceDetails: {},
  };

  const created: any[] = [];

  // 1. Unassigned upcoming — tests: status strip "Scheduled", doorstep
  //    payment badge, reschedule/cancel buttons
  created.push(ctx.createJob({
    ...baseJob,
    scheduledDate: addDays(2),
    timeSlot: "8:00 AM - 10:00 AM",
    status: "Unassigned",
    jobType: "Regular",
    packageName: "Smart Wash [TEST DATA]",
    packageType: "SMART_WASH",
    paymentStatus: "Pending",
  } as any));

  // 2. Assigned upcoming — tests: status strip "Team Assigned", real
  //    Track button
  created.push(ctx.createJob({
    ...baseJob,
    scheduledDate: addDays(1),
    timeSlot: "6:00 PM - 8:00 PM",
    status: "Assigned",
    jobType: "Regular",
    packageName: "Elite Wash [TEST DATA]",
    packageType: "ELITE_WASH",
    paymentStatus: "Pending",
  } as any));

  // 3. Completed, unrated — tests: "Rate this wash" button
  created.push(ctx.createJob({
    ...baseJob,
    scheduledDate: pastDate(3),
    timeSlot: "8:00 AM - 10:00 AM",
    status: "Completed",
    jobType: "Regular",
    packageName: "Smart Wash [TEST DATA]",
    packageType: "SMART_WASH",
    paymentStatus: "Paid",
  } as any));

  // 4. Completed, already rated — tests: real star display
  const ratedJob = ctx.createJob({
    ...baseJob,
    scheduledDate: pastDate(7),
    timeSlot: "6:00 PM - 8:00 PM",
    status: "Completed",
    jobType: "Regular",
    packageName: "Express Wash [TEST DATA]",
    packageType: "EXPRESS_WASH",
    paymentStatus: "Paid",
  } as any);
  ctx.updateJob(ratedJob.jobId, {
    customerRating: 5,
    customerRatingComment: "[TEST DATA] Great service, very punctual!",
    customerRatingSubmittedAt: new Date().toISOString(),
  });
  created.push(ratedJob);

  // 5. Cancelled + Paid — tests: "Request Refund" button
  const cancelledJob = ctx.createJob({
    ...baseJob,
    scheduledDate: pastDate(1),
    timeSlot: "8:00 AM - 10:00 AM",
    status: "Unassigned",
    jobType: "Regular",
    packageName: "Elite Wash [TEST DATA]",
    packageType: "ELITE_WASH",
    paymentStatus: "Paid",
  } as any);
  ctx.updateJob(cancelledJob.jobId, {
    status: "Cancelled",
    cancellationReason: "[TEST DATA] Seeded for refund testing",
    cancelledAt: new Date().toISOString(),
  });
  created.push(cancelledJob);

  // 6. Upcoming with a real pending reschedule request — tests the
  //    reschedule banner and the OM Reschedule Requests approval tab
  const rescheduleJob = ctx.createJob({
    ...baseJob,
    scheduledDate: addDays(3),
    timeSlot: "8:00 AM - 10:00 AM",
    status: "Unassigned",
    jobType: "Regular",
    packageName: "Smart Wash [TEST DATA]",
    packageType: "SMART_WASH",
    paymentStatus: "Pending",
  } as any);
  ctx.updateJob(rescheduleJob.jobId, {
    rescheduleRequestStatus: "pending",
    rescheduleRequestedDate: addDays(5),
    rescheduleRequestedSlot: "6:00 PM - 8:00 PM",
  });
  created.push(rescheduleJob);

  markPortalTestDataSeeded();
  return { seeded: true, count: created.length };
}
