/**
 * portalTestDataSeed — real, one-time test data for verifying every
 * customer portal feature end to end.
 *
 * Follows the same real migration pattern already established in this
 * app (see MigrationInitializer.tsx / payrollMigrationService.ts): a
 * versioned key checked once, marked "DONE" after running, never
 * re-runs. This does NOT touch fresh/empty localStorage seed data (that
 * mechanism only fires on an empty database) — this runs regardless of
 * what's already there, and only ever adds new, clearly-labeled test
 * jobs, never modifies or deletes anything real.
 *
 * Targets Priya Shah (9800100001) — a real, already-existing customer
 * with an active subscription — looked up dynamically by phone number.
 *
 * FIXED after a real production incident: the first version picked
 * dates without checking createJob()'s real business rules (no Sunday
 * jobs, jobs must fall in the 05:00-09:00 wash band), which threw an
 * uncaught error and crashed the customer's entire dashboard via the
 * error boundary. This version:
 *   - only ever generates non-Sunday dates
 *   - only ever uses real morning slots already used in the booking
 *     flow (6-8 AM, 8-10 AM), which are known-safe against the wash
 *     band rule
 *   - wraps every single job creation in its own try/catch, so one
 *     failure can never take down the rest, or the dashboard
 *   - always marks itself done at the end, even if some jobs failed,
 *     so a partial run can never retry forever and keep duplicating
 */

const SEED_VERSION = "V2"; // bumped after the V1 incident - V1's flag is
                            // intentionally abandoned, not reused, so
                            // this always gets a real, fresh run rather
                            // than silently trusting a state that may
                            // have partially failed
const SEED_KEY = `PORTAL_TEST_DATA_SEED_${SEED_VERSION}`;

export function hasSeededPortalTestData(): boolean {
  return localStorage.getItem(SEED_KEY) === "DONE";
}

export function markPortalTestDataSeeded(): void {
  localStorage.setItem(SEED_KEY, "DONE");
}

const TEST_PHONE = "9800100001"; // Priya Shah — real, existing customer

// Real, safe morning slots only - matches the actual slots already
// offered in the booking flow, confirmed safe against the wash-band rule.
const SAFE_SLOT_A = "6:00 AM - 8:00 AM";
const SAFE_SLOT_B = "8:00 AM - 10:00 AM";

// Real next-non-Sunday date, n weekdays-ish out. If the naive n-day-out
// date lands on a Sunday, rolls forward one more day - never returns a
// Sunday, ever.
function safeDate(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export interface SeedContext {
  customers: any[];
  createJob: (job: any) => any;
  updateJob: (jobId: string, updates: any) => void;
}

export function seedPortalTestData(ctx: SeedContext): { seeded: boolean; count: number; failures: number } {
  if (hasSeededPortalTestData()) return { seeded: false, count: 0, failures: 0 };

  const customer = ctx.customers.find((c: any) => c.phone?.replace(/\D/g, "").endsWith(TEST_PHONE));
  if (!customer) return { seeded: false, count: 0, failures: 0 };

  const baseJob = {
    customerId: customer.customerId,
    vehicleDetails: { category: "Hatchback / Compact Sedan", brand: "Hyundai", color: "Silver", registration: "GJ05BE1001" },
    location: { addressLine1: customer.address?.line1 || "", area: customer.address?.area || "", city: customer.address?.city || "Surat", pinCode: customer.address?.pinCode || "" },
    serviceDetails: {},
  };

  // Every entry is created inside its own try/catch below, so one real
  // validation failure (a rule this file doesn't yet know about) can
  // never stop the rest from being created, or crash the dashboard.
  const jobSpecs = [
    // 1. Unassigned upcoming — status strip "Scheduled", doorstep payment badge
    { scheduledDate: safeDate(2), timeSlot: SAFE_SLOT_B, status: "Unassigned", packageName: "Smart Wash [TEST DATA]", packageType: "SMART_WASH", paymentStatus: "Pending" },
    // 2. Assigned upcoming — status strip "Team Assigned", real Track button
    { scheduledDate: safeDate(1), timeSlot: SAFE_SLOT_A, status: "Assigned", packageName: "Elite Wash [TEST DATA]", packageType: "ELITE_WASH", paymentStatus: "Pending" },
    // 3. Completed, unrated — "Rate this wash" button
    { scheduledDate: safeDate(-3), timeSlot: SAFE_SLOT_B, status: "Completed", packageName: "Smart Wash [TEST DATA]", packageType: "SMART_WASH", paymentStatus: "Paid" },
    // 4. Completed, will be rated after creation — real star display
    { scheduledDate: safeDate(-7), timeSlot: SAFE_SLOT_A, status: "Completed", packageName: "Express Wash [TEST DATA]", packageType: "EXPRESS_WASH", paymentStatus: "Paid", _rate: true },
    // 5. Will be cancelled after creation, paid — "Request Refund" button
    { scheduledDate: safeDate(4), timeSlot: SAFE_SLOT_B, status: "Unassigned", packageName: "Elite Wash [TEST DATA]", packageType: "ELITE_WASH", paymentStatus: "Paid", _cancel: true },
    // 6. Will get a pending reschedule request after creation
    { scheduledDate: safeDate(3), timeSlot: SAFE_SLOT_A, status: "Unassigned", packageName: "Smart Wash [TEST DATA]", packageType: "SMART_WASH", paymentStatus: "Pending", _reschedule: true },
  ];

  let count = 0;
  let failures = 0;

  for (const spec of jobSpecs) {
    try {
      const { _rate, _cancel, _reschedule, ...jobData } = spec as any;
      const job = ctx.createJob({ ...baseJob, ...jobData, jobType: "Regular" });

      if (_rate) {
        ctx.updateJob(job.jobId, {
          customerRating: 5,
          customerRatingComment: "[TEST DATA] Great service, very punctual!",
          customerRatingSubmittedAt: new Date().toISOString(),
        });
      }
      if (_cancel) {
        ctx.updateJob(job.jobId, {
          status: "Cancelled",
          cancellationReason: "[TEST DATA] Seeded for refund testing",
          cancelledAt: new Date().toISOString(),
        });
      }
      if (_reschedule) {
        ctx.updateJob(job.jobId, {
          rescheduleRequestStatus: "pending",
          rescheduleRequestedDate: safeDate(6),
          rescheduleRequestedSlot: SAFE_SLOT_B,
        });
      }
      count++;
    } catch (err) {
      // A real validation this file doesn't know about yet - logged,
      // not thrown, so it can never take down the rest or the dashboard.
      console.warn("[portalTestDataSeed] Skipped one test job:", err);
      failures++;
    }
  }

  markPortalTestDataSeeded();
  return { seeded: true, count, failures };
}
